from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.all_models import QualificationPack, User, AuditLog
from app.schemas.schemas import QualificationPackSchema, MatchRequest, QualificationMatchResponse
from app.services.qualification_matcher import qualification_matcher
from app.services.import_service import qp_importer

router = APIRouter(prefix="/qualifications", tags=["Qualifications"])

def get_current_user_obj(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return db.query(User).filter(User.id == payload["sub"]).first()

@router.get("", response_model=List[QualificationPackSchema])
def list_qualifications(
    q: Optional[str] = None,
    sector: Optional[str] = None,
    level: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(QualificationPack)
    if sector:
        query = query.filter(QualificationPack.sector.ilike(f"%{sector}%"))
    if level:
        query = query.filter(QualificationPack.nsqf_level == level)
    if q:
        query = query.filter(
            (QualificationPack.title.ilike(f"%{q}%")) |
            (QualificationPack.qp_code.ilike(f"%{q}%")) |
            (QualificationPack.sector.ilike(f"%{q}%"))
        )
    return query.all()

@router.get("/{qp_id}", response_model=QualificationPackSchema)
def get_qualification(qp_id: str, db: Session = Depends(get_db)):
    qp = db.query(QualificationPack).filter(
        (QualificationPack.id == qp_id) | (QualificationPack.qp_code == qp_id)
    ).first()
    if not qp:
        raise HTTPException(status_code=404, detail="Qualification Pack not found")
    return qp

@router.post("/import")
def import_qualifications(
    qp_list: List[Dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can import qualification packs")
    
    result = qp_importer.import_from_json_data(db, qp_list)
    db.add(AuditLog(
        user_id=current_user.id,
        action="IMPORT_QUALIFICATION_PACKS",
        resource_type="QUALIFICATION_PACK",
        details_json=result
    ))
    db.commit()
    return result

@router.post("/match", response_model=QualificationMatchResponse)
def match_qualifications(
    match_req: MatchRequest,
    db: Session = Depends(get_db)
):
    return qualification_matcher.match(
        db=db,
        tasks_summary=match_req.tasks_summary,
        tools_used=match_req.tools_used,
        trade=match_req.trade,
        years_experience=match_req.years_experience
    )
