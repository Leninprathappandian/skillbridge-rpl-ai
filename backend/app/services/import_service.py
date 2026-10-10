import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.all_models import QualificationPack, Competency, AssessmentCriterion

class QualificationPackImporter:
    def import_from_json_data(self, db: Session, qp_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        imported_count = 0
        updated_count = 0
        errors = []

        for item in qp_list:
            qp_code = item.get("qp_code")
            if not qp_code or not item.get("title"):
                errors.append(f"Skipped record missing required qp_code or title: {item}")
                continue

            existing_qp = db.query(QualificationPack).filter(QualificationPack.qp_code == qp_code).first()
            if existing_qp:
                # Update existing
                existing_qp.title = item.get("title", existing_qp.title)
                existing_qp.nsqf_level = item.get("nsqf_level", existing_qp.nsqf_level)
                existing_qp.version = str(item.get("version", existing_qp.version))
                existing_qp.sector = item.get("sector", existing_qp.sector)
                existing_qp.description = item.get("description", existing_qp.description)
                existing_qp.source = item.get("source", existing_qp.source)
                existing_qp.is_official = item.get("is_official", True)
                existing_qp.raw_data_json = item
                qp_obj = existing_qp
                updated_count += 1
            else:
                qp_obj = QualificationPack(
                    qp_code=qp_code,
                    title=item["title"],
                    nsqf_level=item.get("nsqf_level", 4),
                    version=str(item.get("version", "1.0")),
                    sector=item.get("sector", "General"),
                    description=item.get("description", ""),
                    source=item.get("source", "MSDE NCVET Official Qualification Register"),
                    is_official=item.get("is_official", True),
                    raw_data_json=item
                )
                db.add(qp_obj)
                db.flush()
                imported_count += 1

            # Import competencies
            competencies_data = item.get("competencies", [])
            for c_data in competencies_data:
                nos_code = c_data.get("nos_code")
                if not nos_code:
                    continue

                existing_comp = db.query(Competency).filter(
                    Competency.qp_id == qp_obj.id,
                    Competency.nos_code == nos_code
                ).first()

                if existing_comp:
                    existing_comp.title = c_data.get("title", existing_comp.title)
                    existing_comp.description = c_data.get("description", existing_comp.description)
                    existing_comp.weight = c_data.get("weight", existing_comp.weight)
                    comp_obj = existing_comp
                else:
                    comp_obj = Competency(
                        qp_id=qp_obj.id,
                        nos_code=nos_code,
                        title=c_data.get("title", "Competency Unit"),
                        description=c_data.get("description", ""),
                        weight=c_data.get("weight", 1.0)
                    )
                    db.add(comp_obj)
                    db.flush()

                # Import criteria
                criteria_data = c_data.get("criteria", [])
                for cr_data in criteria_data:
                    crit_code = cr_data.get("criterion_code")
                    if not crit_code:
                        continue

                    existing_crit = db.query(AssessmentCriterion).filter(
                        AssessmentCriterion.competency_id == comp_obj.id,
                        AssessmentCriterion.criterion_code == crit_code
                    ).first()

                    if existing_crit:
                        existing_crit.description = cr_data.get("description", existing_crit.description)
                        existing_crit.max_score = cr_data.get("max_score", existing_crit.max_score)
                        existing_crit.is_mandatory = cr_data.get("is_mandatory", existing_crit.is_mandatory)
                        existing_crit.is_safety_critical = cr_data.get("is_safety_critical", existing_crit.is_safety_critical)
                        existing_crit.rubric_definitions_json = cr_data.get("rubric_definitions_json", existing_crit.rubric_definitions_json)
                    else:
                        crit_obj = AssessmentCriterion(
                            competency_id=comp_obj.id,
                            criterion_code=crit_code,
                            description=cr_data.get("description", ""),
                            max_score=cr_data.get("max_score", 10.0),
                            is_mandatory=cr_data.get("is_mandatory", False),
                            is_safety_critical=cr_data.get("is_safety_critical", False),
                            rubric_definitions_json=cr_data.get("rubric_definitions_json", {})
                        )
                        db.add(crit_obj)

        db.commit()
        return {
            "imported_count": imported_count,
            "updated_count": updated_count,
            "errors": errors
        }

qp_importer = QualificationPackImporter()
