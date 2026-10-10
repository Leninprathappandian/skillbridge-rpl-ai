from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.all_models import SyncOperation, AssessmentResult, User, AuditLog
from app.schemas.schemas import SyncRequest, SyncResponse

router = APIRouter(prefix="/sync", tags=["Offline Sync"])

def get_current_user_obj(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return db.query(User).filter(User.id == payload["sub"]).first()

@router.post("", response_model=SyncResponse)
def process_sync_queue(
    sync_req: SyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    processed = 0
    duplicates = 0
    errors = 0
    results_log = []

    for item in sync_req.operations:
        existing = db.query(SyncOperation).filter(SyncOperation.client_op_id == item.client_op_id).first()
        if existing:
            duplicates += 1
            results_log.append({
                "client_op_id": item.client_op_id,
                "status": "duplicate",
                "message": "Operation already processed previously."
            })
            continue

        try:
            op_type = item.type
            payload = item.payload

            if op_type == "SAVE_RESULT":
                assessment_id = payload.get("assessment_id")
                criterion_id = payload.get("criterion_id")
                score = payload.get("score", 0.0)
                obs = payload.get("observations", "")
                evidence_ref = payload.get("evidence_ref", "")
                flagged_safety = payload.get("flagged_safety", False)

                if assessment_id and criterion_id:
                    result_obj = db.query(AssessmentResult).filter(
                        AssessmentResult.assessment_id == assessment_id,
                        AssessmentResult.criterion_id == criterion_id
                    ).first()

                    if result_obj:
                        result_obj.score = score
                        result_obj.observations = obs
                        result_obj.evidence_ref = evidence_ref
                        result_obj.flagged_safety = flagged_safety
                    else:
                        db.add(AssessmentResult(
                            assessment_id=assessment_id,
                            criterion_id=criterion_id,
                            score=score,
                            observations=obs,
                            evidence_ref=evidence_ref,
                            flagged_safety=flagged_safety
                        ))

            # Record sync operation
            sync_op = SyncOperation(
                client_op_id=item.client_op_id,
                user_id=current_user.id,
                status="processed",
                payload_json=payload
            )
            db.add(sync_op)
            db.flush()
            processed += 1
            results_log.append({
                "client_op_id": item.client_op_id,
                "status": "processed",
                "message": "Successfully synchronized."
            })

        except Exception as e:
            errors += 1
            results_log.append({
                "client_op_id": item.client_op_id,
                "status": "error",
                "message": str(e)
            })

    db.commit()
    return SyncResponse(
        processed_count=processed,
        duplicates_count=duplicates,
        errors_count=errors,
        results=results_log
    )

@router.get("/status")
def get_sync_status(db: Session = Depends(get_db)):
    total_ops = db.query(SyncOperation).count()
    return {"status": "online", "total_sync_operations_processed": total_ops}
