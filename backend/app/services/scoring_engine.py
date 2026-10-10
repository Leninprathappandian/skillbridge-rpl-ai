from typing import List, Dict
from sqlalchemy.orm import Session

from app.models.all_models import Assessment, AssessmentResult, AssessmentCriterion, Competency, QualificationPack
from app.schemas.schemas import DetailedScoringSummary, CompetencyResultSummary

class StandardizedScoringEngine:
    VERSION = "v1.0-standard"

    def calculate_scoring(self, db: Session, assessment_id: str) -> DetailedScoringSummary:
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")

        qp = db.query(QualificationPack).filter(QualificationPack.id == assessment.qp_id).first()
        if not qp:
            raise ValueError("Qualification Pack not found")

        # Map saved results by criterion_id
        results_by_criterion: Dict[str, AssessmentResult] = {
            r.criterion_id: r for r in assessment.results
        }

        overall_achieved = 0.0
        overall_max = 0.0
        mandatory_failed = False
        safety_critical_flagged = False
        missing_evidence_count = 0
        competency_summaries: List[CompetencyResultSummary] = []

        for competency in qp.competencies:
            comp_achieved = 0.0
            comp_max = 0.0
            comp_passed = True
            comp_missing_evidence: List[str] = []
            comp_safety_violations: List[str] = []

            for criterion in competency.criteria:
                result = results_by_criterion.get(criterion.id)
                score = result.score if result else 0.0
                obs = result.observations if result else ""
                evidence_ref = result.evidence_ref if result else ""
                flagged_safety = result.flagged_safety if result else False

                comp_achieved += score * competency.weight
                comp_max += criterion.max_score * competency.weight

                # Check evidence missing
                if not obs and not evidence_ref:
                    comp_missing_evidence.append(criterion.criterion_code)
                    missing_evidence_count += 1

                # Check mandatory criterion (needs at least 60% of max score)
                passing_score_threshold = 0.6 * criterion.max_score
                if criterion.is_mandatory and score < passing_score_threshold:
                    mandatory_failed = True
                    comp_passed = False

                # Check safety critical
                if criterion.is_safety_critical and (flagged_safety or score < passing_score_threshold):
                    safety_critical_flagged = True
                    comp_safety_violations.append(f"{criterion.criterion_code}: Safety standard breached or zero score")
                    comp_passed = False

            comp_pct = round((comp_achieved / comp_max * 100), 2) if comp_max > 0 else 0.0
            if comp_pct < 60.0:
                comp_passed = False

            competency_summaries.append(CompetencyResultSummary(
                competency_id=competency.id,
                nos_code=competency.nos_code,
                title=competency.title,
                achieved_score=round(comp_achieved, 2),
                max_score=round(comp_max, 2),
                percentage=comp_pct,
                passed=comp_passed,
                missing_evidence_criteria=comp_missing_evidence,
                safety_violations=comp_safety_violations
            ))

            overall_achieved += comp_achieved
            overall_max += comp_max

        overall_pct = round((overall_achieved / overall_max * 100), 2) if overall_max > 0 else 0.0

        # Formulate assessment recommendation
        if safety_critical_flagged or mandatory_failed:
            recommendation = "BLOCKED: Mandatory criteria or safety-critical standard failed."
        elif missing_evidence_count > 0:
            recommendation = "PENDING EVIDENCE: Complete evidence or observations required before approval."
        elif overall_pct >= 70.0 and all(cs.passed for cs in competency_summaries):
            recommendation = "RECOMMENDED: Meets all competency requirements for RPL Certification."
        else:
            recommendation = "REQUIRES REASSESSMENT: Worker requires targeted practical training in deficient NOS units."

        return DetailedScoringSummary(
            assessment_id=assessment_id,
            overall_score=round(overall_achieved, 2),
            overall_max=round(overall_max, 2),
            overall_percentage=overall_pct,
            competency_summaries=competency_summaries,
            mandatory_failed=mandatory_failed,
            safety_critical_flagged=safety_critical_flagged,
            missing_evidence_count=missing_evidence_count,
            recommendation=recommendation,
            scoring_rule_version=self.VERSION
        )

scoring_engine = StandardizedScoringEngine()
