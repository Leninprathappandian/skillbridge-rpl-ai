import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="worker") # worker, assessor, admin
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    worker_profile = relationship("Worker", back_populates="user", uselist=False)

class Worker(Base):
    __tablename__ = "workers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    preferred_language = Column(String(50), default="English")
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    years_experience = Column(Float, default=0.0)
    trade = Column(String(255), nullable=False)
    previous_training = Column(Text, nullable=True)
    consent_given = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="worker_profile")
    declarations = relationship("WorkerDeclaration", back_populates="worker")
    assessments = relationship("Assessment", back_populates="worker")

class QualificationPack(Base):
    __tablename__ = "qualification_packs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    qp_code = Column(String(100), unique=True, index=True, nullable=False) # e.g., ELE/Q1401
    title = Column(String(255), nullable=False)
    nsqf_level = Column(Integer, nullable=False, default=4)
    version = Column(String(50), nullable=False, default="1.0")
    sector = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(255), nullable=False, default="MSDE NCVET Official Registry")
    is_official = Column(Boolean, default=True)
    raw_data_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    competencies = relationship("Competency", back_populates="qualification_pack", cascade="all, delete-orphan")

class Competency(Base):
    __tablename__ = "competencies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    qp_id = Column(String(36), ForeignKey("qualification_packs.id"), nullable=False)
    nos_code = Column(String(100), nullable=False) # e.g. ELE/N1401
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    qualification_pack = relationship("QualificationPack", back_populates="competencies")
    criteria = relationship("AssessmentCriterion", back_populates="competency", cascade="all, delete-orphan")

class AssessmentCriterion(Base):
    __tablename__ = "assessment_criteria"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    competency_id = Column(String(36), ForeignKey("competencies.id"), nullable=False)
    criterion_code = Column(String(100), nullable=False) # e.g. PC1.1
    description = Column(Text, nullable=False)
    max_score = Column(Float, default=10.0)
    is_mandatory = Column(Boolean, default=False)
    is_safety_critical = Column(Boolean, default=False)
    rubric_definitions_json = Column(JSON, nullable=True) # { "0": "Not demonstrated", "5": "Partial", "10": "Proficient" }
    created_at = Column(DateTime, default=datetime.utcnow)
    
    competency = relationship("Competency", back_populates="criteria")

class WorkerDeclaration(Base):
    __tablename__ = "worker_declarations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    worker_id = Column(String(36), ForeignKey("workers.id"), nullable=False)
    status = Column(String(50), default="draft") # draft, submitted
    years_experience = Column(Float, default=0.0)
    tasks_summary = Column(Text, nullable=False)
    tools_used = Column(Text, nullable=False)
    safety_procedures = Column(Text, nullable=True)
    frequency_json = Column(JSON, nullable=True)
    evidence_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    worker = relationship("Worker", back_populates="declarations")
    matches = relationship("QualificationMatch", back_populates="declaration")

class QualificationMatch(Base):
    __tablename__ = "qualification_matches"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    declaration_id = Column(String(36), ForeignKey("worker_declarations.id"), nullable=False)
    qp_id = Column(String(36), ForeignKey("qualification_packs.id"), nullable=False)
    match_score = Column(Float, nullable=False) # 0.0 to 1.0 (or 0-100%)
    matching_skills_json = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=False)
    uncertainties_json = Column(JSON, nullable=True)
    model_info = Column(String(100), default="SkillBridge Semantic Matcher v1.0 (TF-IDF + Cosine)")
    confirmed_by_user = Column(Boolean, default=False)
    confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    declaration = relationship("WorkerDeclaration", back_populates="matches")
    qualification_pack = relationship("QualificationPack")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    worker_id = Column(String(36), ForeignKey("workers.id"), nullable=False)
    qp_id = Column(String(36), ForeignKey("qualification_packs.id"), nullable=False)
    assessor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    declaration_id = Column(String(36), ForeignKey("worker_declarations.id"), nullable=True)
    status = Column(String(50), default="draft") # draft, in_progress, submitted, under_review, approved, returned
    scoring_rule_version = Column(String(50), default="v1.0-standard")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    worker = relationship("Worker", back_populates="assessments")
    qualification_pack = relationship("QualificationPack")
    assessor = relationship("User", foreign_keys=[assessor_id])
    results = relationship("AssessmentResult", back_populates="assessment", cascade="all, delete-orphan")
    reviews = relationship("ReviewDecision", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentResult(Base):
    __tablename__ = "assessment_results"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False)
    criterion_id = Column(String(36), ForeignKey("assessment_criteria.id"), nullable=False)
    score = Column(Float, nullable=False, default=0.0)
    observations = Column(Text, nullable=True)
    evidence_ref = Column(String(255), nullable=True)
    flagged_safety = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assessment = relationship("Assessment", back_populates="results")
    criterion = relationship("AssessmentCriterion")

class ReviewDecision(Base):
    __tablename__ = "review_decisions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    decision = Column(String(50), nullable=False) # approved, returned, reassessment_requested
    decision_reason = Column(Text, nullable=False)
    version = Column(String(50), default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assessment = relationship("Assessment", back_populates="reviews")
    reviewer = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SyncOperation(Base):
    __tablename__ = "sync_operations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    client_op_id = Column(String(100), unique=True, nullable=False)
    user_id = Column(String(36), nullable=False)
    status = Column(String(50), default="processed") # processed, duplicate, error
    payload_json = Column(JSON, nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow)
