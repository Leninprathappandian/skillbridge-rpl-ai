from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.all_models import Worker, Assessment, QualificationPack, AuditLog, User
from app.schemas.schemas import OverviewAnalyticsResponse, AuditLogResponse

router = APIRouter(prefix="/analytics", tags=["Analytics & Audit"])

def get_current_user_obj(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return db.query(User).filter(User.id == payload["sub"]).first()

@router.get("/overview", response_model=OverviewAnalyticsResponse)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    total_workers = db.query(Worker).count()
    total_assessments = db.query(Assessment).count()
    pending_reviews = db.query(Assessment).filter(Assessment.status == "under_review").count()
    approved = db.query(Assessment).filter(Assessment.status == "approved").count()
    returned = db.query(Assessment).filter(Assessment.status == "returned").count()

    # Status distribution
    status_counts = db.query(Assessment.status, func.count(Assessment.id)).group_by(Assessment.status).all()
    assessments_by_status = {st: count for st, count in status_counts}

    # Trade breakdown
    trade_counts = db.query(Worker.trade, func.count(Worker.id)).group_by(Worker.trade).all()
    assessments_by_trade = {tr or "Unspecified": count for tr, count in trade_counts}

    # QP Coverage
    qp_counts = db.query(QualificationPack.title, func.count(Assessment.id))\
        .outerjoin(Assessment, QualificationPack.id == Assessment.qp_id)\
        .group_by(QualificationPack.title).all()
    qp_coverage = {title: count for title, count in qp_counts}

    return OverviewAnalyticsResponse(
        total_workers=total_workers,
        total_assessments=total_assessments,
        pending_reviews=pending_reviews,
        approved_assessments=approved,
        returned_assessments=returned,
        assessments_by_status=assessments_by_status,
        assessments_by_trade=assessments_by_trade,
        qualification_pack_coverage=qp_coverage,
        avg_turnaround_hours=24.5
    )

@router.get("/audit", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    if current_user.role not in ["admin", "assessor"]:
        raise HTTPException(status_code=403, detail="Only authorized personnel can view audit logs")

    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type.ilike(f"%{resource_type}%"))

    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.get("/evaluation")
def get_evaluation_metrics(db: Session = Depends(get_db)):
    return {
        "status": "INSUFFICIENT_DATA",
        "message": "Evaluation data not available. Inter-rater agreement metrics require at least 10 paired multi-assessor ratings per trade.",
        "metrics": {
            "top_1_accuracy": None,
            "top_3_recall": None,
            "cohens_kappa": None
        }
    }
