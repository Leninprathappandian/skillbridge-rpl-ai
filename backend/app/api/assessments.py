from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.all_models import Assessment, AssessmentResult, Worker, QualificationPack, ReviewDecision, User, AuditLog
from app.schemas.schemas import (
    AssessmentResponse, UpdateAssessmentResultsRequest, DetailedScoringSummary,
    ReviewDecisionCreate, ReviewDecisionResponse
)
from app.services.scoring_engine import scoring_engine
from app.services.report_generator import pdf_report_generator

router = APIRouter(prefix="/assessments", tags=["Assessments"])

def get_current_user_obj(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return db.query(User).filter(User.id == payload["sub"]).first()

@router.post("", response_model=AssessmentResponse)
def create_assessment(
    worker_id: str,
    qp_id: str,
    declaration_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    qp = db.query(QualificationPack).filter(QualificationPack.id == qp_id).first()
    if not qp:
        raise HTTPException(status_code=404, detail="Qualification pack not found")

    assessment = Assessment(
        worker_id=worker_id,
        qp_id=qp_id,
        assessor_id=current_user.id if current_user.role == "assessor" else None,
        declaration_id=declaration_id,
        status="draft",
        scoring_rule_version="v1.0-standard"
    )
    db.add(assessment)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_ASSESSMENT",
        resource_type="ASSESSMENT",
        resource_id=assessment.id
    ))
    db.commit()
    db.refresh(assessment)
    return assessment

@router.get("", response_model=List[AssessmentResponse])
def list_assessments(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    query = db.query(Assessment)
    if current_user.role == "worker":
        # Find worker record
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return []
        query = query.filter(Assessment.worker_id == worker.id)
    elif current_user.role == "assessor":
        query = query.filter(
            (Assessment.assessor_id == current_user.id) | (Assessment.assessor_id.is_(None))
        )

    if status:
        query = query.filter(Assessment.status == status)

    return query.all()

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.put("/{assessment_id}/results")
def update_assessment_results(
    assessment_id: str,
    req: UpdateAssessmentResultsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    if current_user.role not in ["assessor", "admin"]:
        raise HTTPException(status_code=403, detail="Only assessors or admins can record assessment results")

    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Update results
    for score_in in req.results:
        existing = db.query(AssessmentResult).filter(
            AssessmentResult.assessment_id == assessment_id,
            AssessmentResult.criterion_id == score_in.criterion_id
        ).first()

        if existing:
            existing.score = score_in.score
            existing.observations = score_in.observations
            existing.evidence_ref = score_in.evidence_ref
            existing.flagged_safety = score_in.flagged_safety
        else:
            db.add(AssessmentResult(
                assessment_id=assessment_id,
                criterion_id=score_in.criterion_id,
                score=score_in.score,
                observations=score_in.observations,
                evidence_ref=score_in.evidence_ref,
                flagged_safety=score_in.flagged_safety
            ))

    assessment.status = req.status
    if not assessment.assessor_id:
        assessment.assessor_id = current_user.id

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_ASSESSMENT_RESULTS",
        resource_type="ASSESSMENT",
        resource_id=assessment_id,
        details_json={"status": req.status, "item_count": len(req.results)}
    ))
    db.commit()

    # Calculate scoring summary
    scoring = scoring_engine.calculate_scoring(db, assessment_id)
    return {"status": assessment.status, "scoring_summary": scoring}

@router.get("/{assessment_id}/scoring", response_model=DetailedScoringSummary)
def get_assessment_scoring(
    assessment_id: str,
    db: Session = Depends(get_db)
):
    return scoring_engine.calculate_scoring(db, assessment_id)

@router.post("/{assessment_id}/decision", response_model=ReviewDecisionResponse)
def record_review_decision(
    assessment_id: str,
    dec_in: ReviewDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    if current_user.role not in ["admin", "assessor"]:
        raise HTTPException(status_code=403, detail="Unauthorized to record review decision")

    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    decision = ReviewDecision(
        assessment_id=assessment_id,
        reviewer_id=current_user.id,
        decision=dec_in.decision,
        decision_reason=dec_in.decision_reason,
        version="v1.0"
    )
    db.add(decision)
    db.flush()

    if dec_in.decision == "approved":
        assessment.status = "approved"
    elif dec_in.decision == "returned":
        assessment.status = "returned"
    elif dec_in.decision == "reassessment_requested":
        assessment.status = "in_progress"

    db.add(AuditLog(
        user_id=current_user.id,
        action="RECORD_REVIEW_DECISION",
        resource_type="REVIEW_DECISION",
        resource_id=decision.id,
        details_json={"decision": dec_in.decision, "assessment_id": assessment_id}
    ))
    db.commit()
    db.refresh(decision)
    return decision

@router.get("/{assessment_id}/report")
def download_assessment_pdf_report(
    assessment_id: str,
    db: Session = Depends(get_db)
):
    try:
        pdf_bytes = pdf_report_generator.generate_assessment_report(db, assessment_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=RPL_Assessment_Report_{assessment_id[:8]}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
