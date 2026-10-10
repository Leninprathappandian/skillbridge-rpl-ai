import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.all_models import QualificationPack, Competency, AssessmentCriterion
from app.schemas.schemas import MatchResultItem, QualificationMatchResponse

class QualificationMatcher:
    def __init__(self):
        self.model_info = "SkillBridge Hybrid Matcher v1.0 (TF-IDF + Keyword Relevance)"

    def _normalize_text(self, text: str) -> str:
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return ' '.join(text.split())

    def match(
        self,
        db: Session,
        tasks_summary: str,
        tools_used: str,
        trade: str,
        years_experience: float = 0.0
    ) -> QualificationMatchResponse:
        # 1. Gather all official QPs in DB
        qps = db.query(QualificationPack).all()
        if not qps:
            return QualificationMatchResponse(
                suggestions=[],
                model_info=self.model_info,
                disclaimer="No qualification packs found in database. Please run the import pipeline."
            )

        # 2. Build target documents per QP
        qp_documents = []
        qp_lookup = []
        for qp in qps:
            comp_texts = [f"{c.title} {c.description or ''}" for c in qp.competencies]
            crit_texts = []
            for c in qp.competencies:
                for cr in c.criteria:
                    crit_texts.append(cr.description)

            full_text = f"{qp.title} {qp.sector} {qp.description or ''} {' '.join(comp_texts)} {' '.join(crit_texts)}"
            norm_full_text = self._normalize_text(full_text)
            qp_documents.append(norm_full_text)
            qp_lookup.append(qp)

        # 3. Build query string from worker's declaration
        worker_query = self._normalize_text(f"{trade} {tasks_summary} {tools_used}")
        if not worker_query.strip():
            worker_query = "general worker experience"

        # 4. Compute TF-IDF Cosine Similarity
        corpus = [worker_query] + qp_documents
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        tfidf_matrix = vectorizer.fit_transform(corpus)

        query_vec = tfidf_matrix[0]
        doc_vecs = tfidf_matrix[1:]

        cosine_sims = cosine_similarity(query_vec, doc_vecs)[0]

        # 5. Combine with Keyword & Trade Boost
        query_words = set(worker_query.split())
        matched_items: List[MatchResultItem] = []

        for idx, qp in enumerate(qp_lookup):
            base_score = float(cosine_sims[idx])

            # Trade exact match boost
            norm_trade = self._normalize_text(trade)
            norm_qp_title = self._normalize_text(qp.title)
            norm_sector = self._normalize_text(qp.sector)

            trade_boost = 0.0
            if norm_trade:
                trade_tokens = [w for w in norm_trade.split() if len(w) > 3]
                if any(w in norm_qp_title or w in norm_sector for w in trade_tokens):
                    trade_boost += 0.35

            # Key tool matches
            doc_words = set(qp_documents[idx].split())
            matching_keywords = list(query_words.intersection(doc_words))
            keyword_ratio = len(matching_keywords) / max(len(query_words), 1)

            final_score = min(0.98, round(base_score * 0.4 + keyword_ratio * 0.3 + trade_boost + 0.1, 3))

            # Matched competencies
            matched_comps = []
            for comp in qp.competencies:
                comp_norm = self._normalize_text(f"{comp.title} {comp.description or ''}")
                if any(w in comp_norm for w in query_words if len(w) > 3):
                    matched_comps.append(f"{comp.nos_code}: {comp.title}")

            if not matched_comps and qp.competencies:
                matched_comps = [f"{qp.competencies[0].nos_code}: {qp.competencies[0].title}"]

            # Explanations & Uncertainties
            explanation_parts = []
            if matching_keywords:
                explanation_parts.append(f"Matched key domain terms: {', '.join(matching_keywords[:6])}.")
            if trade_boost > 0:
                explanation_parts.append(f"Strong trade sector alignment with '{qp.sector}'.")
            if years_experience >= 2.0:
                explanation_parts.append(f"Worker's {years_experience} years experience aligns with NSQF Level {qp.nsqf_level} requirements.")

            explanation = " ".join(explanation_parts) or "Partial semantic similarity based on task description."

            uncertainties = []
            if final_score < 0.45:
                uncertainties.append("Low confidence match - manual assessor verification strongly recommended.")
            if not tools_used or len(tools_used) < 5:
                uncertainties.append("Tools and equipment details were sparse in self-declaration.")

            matched_items.append(MatchResultItem(
                qp_id=qp.id,
                qp_code=qp.qp_code,
                title=qp.title,
                nsqf_level=qp.nsqf_level,
                version=qp.version,
                sector=qp.sector,
                match_score=final_score,
                matching_skills=matching_keywords[:8],
                explanation=explanation,
                uncertainties=uncertainties,
                matched_competencies=matched_comps[:4]
            ))

        # Sort by match score descending
        matched_items.sort(key=lambda x: x.match_score, reverse=True)

        return QualificationMatchResponse(
            suggestions=matched_items[:5],
            model_info=self.model_info,
            disclaimer="Model-generated relevance signal. Not an official qualification or certification."
        )

qualification_matcher = QualificationMatcher()
