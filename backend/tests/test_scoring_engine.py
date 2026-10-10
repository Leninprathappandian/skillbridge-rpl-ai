import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.all_models import (
    QualificationPack, Competency, AssessmentCriterion, Assessment, AssessmentResult, Worker, User
)
from app.services.scoring_engine import scoring_engine

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSession()
    
    # Setup test QP
    qp = QualificationPack(
        qp_code="TEST/Q1001",
        title="Test Electrician",
        nsqf_level=4,
        sector="Electrical"
    )
    db.add(qp)
    db.flush()

    comp = Competency(
        qp_id=qp.id,
        nos_code="TEST/N1001",
        title="Basic Wiring",
        weight=1.0
    )
    db.add(comp)
    db.flush()

    c1 = AssessmentCriterion(
        competency_id=comp.id,
        criterion_code="PC1.1",
        description="Connect wires",
        max_score=10.0,
        is_mandatory=True,
        is_safety_critical=False
    )
    c2 = AssessmentCriterion(
        competency_id=comp.id,
        criterion_code="PC1.2",
        description="Wear safety gloves",
        max_score=10.0,
        is_mandatory=True,
        is_safety_critical=True
    )
    db.add_all([c1, c2])
    db.flush()

    w = Worker(full_name="Test Worker", trade="Electrical")
    db.add(w)
    db.flush()

    ass = Assessment(worker_id=w.id, qp_id=qp.id, status="in_progress")
    db.add(ass)
    db.commit()

    yield db, ass.id, c1.id, c2.id
    db.close()

def test_scoring_passed(db_session):
    db, ass_id, c1_id, c2_id = db_session

    db.add(AssessmentResult(assessment_id=ass_id, criterion_id=c1_id, score=9.0, observations="Good wiring", evidence_ref="REF1"))
    db.add(AssessmentResult(assessment_id=ass_id, criterion_id=c2_id, score=10.0, observations="Wore gloves", evidence_ref="REF2", flagged_safety=False))
    db.commit()

    summary = scoring_engine.calculate_scoring(db, ass_id)
    assert summary.overall_percentage == 95.0
    assert summary.mandatory_failed is False
    assert summary.safety_critical_flagged is False
    assert "RECOMMENDED" in summary.recommendation

def test_safety_violation_blocks(db_session):
    db, ass_id, c1_id, c2_id = db_session

    db.add(AssessmentResult(assessment_id=ass_id, criterion_id=c1_id, score=9.0, observations="Good wiring", evidence_ref="REF1"))
    db.add(AssessmentResult(assessment_id=ass_id, criterion_id=c2_id, score=2.0, observations="No gloves", evidence_ref="REF2", flagged_safety=True))
    db.commit()

    summary = scoring_engine.calculate_scoring(db, ass_id)
    assert summary.safety_critical_flagged is True
    assert "BLOCKED" in summary.recommendation
