from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# AUTH SCHEMAS
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

# WORKER SCHEMAS
class WorkerCreate(BaseModel):
    full_name: str
    preferred_language: str = "English"
    phone: Optional[str] = None
    location: Optional[str] = None
    years_experience: float = 0.0
    trade: str
    previous_training: Optional[str] = None
    consent_given: bool = True

class WorkerResponse(WorkerCreate):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# DECLARATION SCHEMAS
class WorkerDeclarationCreate(BaseModel):
    worker_id: str
    status: str = "draft"
    years_experience: float
    tasks_summary: str
    tools_used: str
    safety_procedures: Optional[str] = None
    frequency_json: Optional[Dict[str, Any]] = None
    evidence_notes: Optional[str] = None

class WorkerDeclarationResponse(WorkerDeclarationCreate):
    id: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

# QUALIFICATION PACK SCHEMAS
class AssessmentCriterionSchema(BaseModel):
    id: Optional[str] = None
    criterion_code: str
    description: str
    max_score: float = 10.0
    is_mandatory: bool = False
    is_safety_critical: bool = False
    rubric_definitions_json: Optional[Dict[str, str]] = None
    class Config:
        from_attributes = True

class CompetencySchema(BaseModel):
    id: Optional[str] = None
    nos_code: str
    title: str
    description: Optional[str] = None
    weight: float = 1.0
    criteria: List[AssessmentCriterionSchema] = []
    class Config:
        from_attributes = True

class QualificationPackSchema(BaseModel):
    id: Optional[str] = None
    qp_code: str
    title: str
    nsqf_level: int
    version: str = "1.0"
    sector: str
    description: Optional[str] = None
    source: str = "MSDE NCVET Official Registry"
    is_official: bool = True
    competencies: List[CompetencySchema] = []
    class Config:
        from_attributes = True

# MATCHING SCHEMAS
class MatchRequest(BaseModel):
    declaration_id: Optional[str] = None
    tasks_summary: str
    tools_used: str
    trade: str
    years_experience: float = 0.0

class MatchResultItem(BaseModel):
    qp_id: str
    qp_code: str
    title: str
    nsqf_level: int
    version: str
    sector: str
    match_score: float # 0.0 to 1.0 relevance signal
    matching_skills: List[str]
    explanation: str
    uncertainties: List[str]
    matched_competencies: List[str]

class QualificationMatchResponse(BaseModel):
    declaration_id: Optional[str] = None
    suggestions: List[MatchResultItem]
    model_info: str
    disclaimer: str = "Model-generated relevance signal. Not an official qualification or certification."

# ASSESSMENT & RESULTS SCHEMAS
class CriterionScoreInput(BaseModel):
    criterion_id: str
    score: float
    observations: Optional[str] = ""
    evidence_ref: Optional[str] = ""
    flagged_safety: bool = False

class UpdateAssessmentResultsRequest(BaseModel):
    results: List[CriterionScoreInput]
    status: str = "in_progress" # draft, submitted

class AssessmentResponse(BaseModel):
    id: str
    worker_id: str
    qp_id: str
    assessor_id: Optional[str] = None
    declaration_id: Optional[str] = None
    status: str
    scoring_rule_version: str
    created_at: datetime
    updated_at: datetime
    worker: Optional[WorkerResponse] = None
    qualification_pack: Optional[QualificationPackSchema] = None
    class Config:
        from_attributes = True

# SCORING OUTPUT SCHEMA
class CompetencyResultSummary(BaseModel):
    competency_id: str
    nos_code: str
    title: str
    achieved_score: float
    max_score: float
    percentage: float
    passed: bool
    missing_evidence_criteria: List[str]
    safety_violations: List[str]

class DetailedScoringSummary(BaseModel):
    assessment_id: str
    overall_score: float
    overall_max: float
    overall_percentage: float
    competency_summaries: List[CompetencyResultSummary]
    mandatory_failed: bool
    safety_critical_flagged: bool
    missing_evidence_count: int
    recommendation: str # 'Recommended for RPL Certification', 'Requires Further Practical Assessment', 'Blocked due to Safety/Mandatory Deficits'
    scoring_rule_version: str

# REVIEW DECISION SCHEMA
class ReviewDecisionCreate(BaseModel):
    decision: str # approved, returned, reassessment_requested
    decision_reason: str

class ReviewDecisionResponse(ReviewDecisionCreate):
    id: str
    assessment_id: str
    reviewer_id: str
    version: str
    created_at: datetime
    class Config:
        from_attributes = True

# OFFLINE SYNC SCHEMA
class SyncOperationItem(BaseModel):
    client_op_id: str
    type: str # 'SAVE_RESULT', 'SUBMIT_ASSESSMENT', 'SAVE_DECLARATION'
    payload: Dict[str, Any]

class SyncRequest(BaseModel):
    operations: List[SyncOperationItem]

class SyncResponse(BaseModel):
    processed_count: int
    duplicates_count: int
    errors_count: int
    results: List[Dict[str, Any]]

# ANALYTICS & AUDIT SCHEMAS
class OverviewAnalyticsResponse(BaseModel):
    total_workers: int
    total_assessments: int
    pending_reviews: int
    approved_assessments: int
    returned_assessments: int
    assessments_by_status: Dict[str, int]
    assessments_by_trade: Dict[str, int]
    qualification_pack_coverage: Dict[str, int]
    avg_turnaround_hours: float

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details_json: Optional[Dict[str, Any]]
    timestamp: datetime
    class Config:
        from_attributes = True
