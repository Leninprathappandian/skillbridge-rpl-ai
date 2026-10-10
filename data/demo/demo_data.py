import json
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.all_models import User, Worker, WorkerDeclaration, Assessment, AssessmentResult, QualificationMatch, QualificationPack, Competency, AssessmentCriterion
from app.services.import_service import qp_importer

def init_demo_data(db: Session):
    # 1. Create tables if not present
    Base.metadata.create_all(bind=engine)

    # 2. Import Official Qualification Packs from JSON
    json_path = os.path.join("data", "qualification_packs", "official_qps.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            qp_data = json.load(f)
            qp_importer.import_from_json_data(db, qp_data)
            print("Imported Official Qualification Packs.")

    # 3. Create Demo Users
    users_to_create = [
        {"username": "admin", "email": "admin@skillbridge.gov.in", "password": "admin123", "role": "admin", "full_name": "System Administrator (MSDE)"},
        {"username": "assessor1", "email": "assessor.sunil@skillbridge.gov.in", "password": "assessor123", "role": "assessor", "full_name": "Sunil Verma (Senior Assessor)"},
        {"username": "worker1", "email": "ramesh.kumar@gmail.com", "password": "worker123", "role": "worker", "full_name": "Ramesh Kumar (Solar Technician Candidate)"},
        {"username": "worker2", "email": "rajesh.sharma@gmail.com", "password": "worker123", "role": "worker", "full_name": "Rajesh Sharma (Mason Candidate)"},
    ]

    created_users = {}
    for u in users_to_create:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user_obj = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                full_name=u["full_name"],
                is_active=True
            )
            db.add(user_obj)
            db.flush()
            created_users[u["username"]] = user_obj
        else:
            created_users[u["username"]] = existing

    db.commit()

    # 4. Create Worker Profiles & Declarations
    w1_user = created_users["worker1"]
    w1 = db.query(Worker).filter(Worker.user_id == w1_user.id).first()
    if not w1:
        w1 = Worker(
            user_id=w1_user.id,
            full_name=w1_user.full_name,
            preferred_language="Hindi",
            phone="+91-9876543210",
            location="Jaipur, Rajasthan",
            years_experience=4.5,
            trade="Solar PV Installation & Wiring",
            previous_training="Informal apprenticeship under local contractor (4 years)",
            consent_given=True
        )
        db.add(w1)
        db.flush()

        dec1 = WorkerDeclaration(
            worker_id=w1.id,
            status="submitted",
            years_experience=4.5,
            tasks_summary="Rooftop solar panel structure assembly, DC cable stringing, inverter mounting, polarity checking, and basic earthing pit connection.",
            tools_used="Multimeter, MC4 crimping tool, torque wrench, safety harness, angle grinder, spirit level",
            safety_procedures="Always wear safety harness on roof, double-check polarity before connecting string, wear insulated gloves.",
            evidence_notes="Uploaded photo of rooftop installation project in Jaipur.",
            frequency_json={"panel_mounting": "Daily", "inverter_wiring": "Weekly"}
        )
        db.add(dec1)
        db.flush()

        # Link match & assessment
        solar_qp = db.query(QualificationPack).filter(QualificationPack.qp_code == "ELE/Q5901").first()
        if solar_qp:
            match1 = QualificationMatch(
                declaration_id=dec1.id,
                qp_id=solar_qp.id,
                match_score=0.92,
                matching_skills_json=["solar", "panel", "wiring", "inverter", "multimeter", "harness"],
                explanation="High semantic and domain term match with Solar Panel Installation Technician.",
                confirmed_by_user=True
            )
            db.add(match1)

            assessor_user = created_users["assessor1"]
            ass1 = Assessment(
                worker_id=w1.id,
                qp_id=solar_qp.id,
                assessor_id=assessor_user.id,
                declaration_id=dec1.id,
                status="in_progress",
                scoring_rule_version="v1.0-standard"
            )
            db.add(ass1)
            db.flush()

            # Seed sample partial results for assessment 1
            for comp in solar_qp.competencies:
                for crit in comp.criteria:
                    res = AssessmentResult(
                        assessment_id=ass1.id,
                        criterion_id=crit.id,
                        score=9.0 if not crit.is_safety_critical else 10.0,
                        observations="Demonstrated proper procedure during practical task evaluation.",
                        evidence_ref="OBS-PHOTO-001.JPG",
                        flagged_safety=False
                    )
                    db.add(res)

    db.commit()
    print("Demo Data Initialized Successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_demo_data(db)
    finally:
        db.close()
