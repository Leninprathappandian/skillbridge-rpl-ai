from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.all_models import Worker, WorkerDeclaration, User, AuditLog
from app.schemas.schemas import WorkerCreate, WorkerResponse, WorkerDeclarationCreate, WorkerDeclarationResponse

router = APIRouter(prefix="/workers", tags=["Workers"])

def get_current_user_obj(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authorization token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("", response_model=WorkerResponse)
def create_worker_profile(
    worker_in: WorkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    worker = Worker(
        user_id=current_user.id,
        full_name=worker_in.full_name,
        preferred_language=worker_in.preferred_language,
        phone=worker_in.phone,
        location=worker_in.location,
        years_experience=worker_in.years_experience,
        trade=worker_in.trade,
        previous_training=worker_in.previous_training,
        consent_given=worker_in.consent_given
    )
    db.add(worker)
    db.flush()
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_WORKER_PROFILE",
        resource_type="WORKER",
        resource_id=worker.id
    ))
    db.commit()
    db.refresh(worker)
    return worker

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker_profile(
    worker_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return worker

@router.get("", response_model=List[WorkerResponse])
def list_workers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    if current_user.role not in ["assessor", "admin"]:
        # Worker can only list themselves
        return db.query(Worker).filter(Worker.user_id == current_user.id).all()
    return db.query(Worker).all()

@router.post("/{worker_id}/declaration", response_model=WorkerDeclarationResponse)
def submit_self_declaration(
    worker_id: str,
    dec_in: WorkerDeclarationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    declaration = WorkerDeclaration(
        worker_id=worker_id,
        status=dec_in.status,
        years_experience=dec_in.years_experience,
        tasks_summary=dec_in.tasks_summary,
        tools_used=dec_in.tools_used,
        safety_procedures=dec_in.safety_procedures,
        frequency_json=dec_in.frequency_json,
        evidence_notes=dec_in.evidence_notes
    )
    db.add(declaration)
    db.flush()
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="SUBMIT_SELF_DECLARATION",
        resource_type="WORKER_DECLARATION",
        resource_id=declaration.id
    ))
    db.commit()
    db.refresh(declaration)
    return declaration
