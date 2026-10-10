import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.all_models import QualificationPack, Competency, AssessmentCriterion
from app.services.qualification_matcher import qualification_matcher

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSession()

    qp1 = QualificationPack(
        qp_code="ELE/Q5901",
        title="Solar Panel Installation Technician",
        nsqf_level=4,
        sector="Electronics & Renewable Energy",
        description="Rooftop solar panel installation and DC inverter wiring"
    )
    qp2 = QualificationPack(
        qp_code="CON/Q0103",
        title="Mason Tiling",
        nsqf_level=3,
        sector="Construction",
        description="Tile cutting, adhesive bedding, and wall plastering"
    )
    db.add_all([qp1, qp2])
    db.flush()

    c1 = Competency(
        qp_id=qp1.id,
        nos_code="ELE/N5901",
        title="Solar Panel Mounting and Inverter Wiring",
        description="Rooftop array structure and multimeter testing"
    )
    db.add(c1)
    db.commit()

    yield db
    db.close()

def test_semantic_match_solar(db_session):
    res = qualification_matcher.match(
        db=db_session,
        tasks_summary="Mounting rooftop solar panels, wiring DC cables and installing inverters",
        tools_used="Multimeter, MC4 crimper, torque wrench",
        trade="Solar PV Installer",
        years_experience=3.0
    )

    assert len(res.suggestions) > 0
    top_match = res.suggestions[0]
    assert top_match.qp_code == "ELE/Q5901"
    assert top_match.match_score > 0.3
    assert "Solar" in top_match.title
    assert "relevance signal" in res.disclaimer.lower()
