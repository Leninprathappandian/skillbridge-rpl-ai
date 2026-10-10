import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assessmentApi } from '../services/api';
import { CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, Layers, Download } from 'lucide-react';

export const ScoringResults: React.FC = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const [scoring, setScoring] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (!assessmentId) return;
        const [ass, sc] = await Promise.all([
          assessmentApi.getOne(assessmentId),
          assessmentApi.getScoring(assessmentId)
        ]);
        setAssessment(ass);
        setScoring(sc);
      } catch (err) {
        console.error("Scoring load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [assessmentId]);

  if (loading || !scoring) {
    return <div className="text-center py-12 text-sm text-slate-500">Calculating Deterministic Scoring Results...</div>;
  }

  const isBlocked = scoring.safety_critical_flagged || scoring.mandatory_failed;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isBlocked 
          ? 'bg-rose-50 border-rose-200 text-rose-950' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Scoring Engine Version: {scoring.scoring_rule_version}
            </span>
            <h2 className="text-2xl font-extrabold mt-1">Competency Assessment Results</h2>
            <p className="text-xs text-slate-600 mt-1">
              Qualification Pack: <span className="font-semibold text-slate-800">{assessment?.qualification_pack?.title}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-blue-600">
              {scoring.overall_percentage}%
            </div>
            <p className="text-xs text-slate-500 font-semibold">{scoring.overall_score} / {scoring.overall_max} Total Points</p>
          </div>
        </div>

        {/* Recommendation Box */}
        <div className={`mt-5 p-4 rounded-xl border flex items-start space-x-3 ${
          isBlocked 
            ? 'bg-rose-100 border-rose-300 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          {isBlocked ? (
            <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm">Assessment Recommendation</p>
            <p className="text-xs font-semibold mt-0.5">{scoring.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Safety / Mandatory Warnings */}
      {(scoring.mandatory_failed || scoring.safety_critical_flagged || scoring.missing_evidence_count > 0) && (
        <div className="space-y-2">
          {scoring.safety_critical_flagged && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <span>Safety-Critical Violation Flagged: Certification recommendation blocked until re-evaluation.</span>
            </div>
          )}
          {scoring.missing_evidence_count > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>{scoring.missing_evidence_count} criteria missing required observations or evidence photo references.</span>
            </div>
          )}
        </div>
      )}

      {/* NOS Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-600" />
          <span>Competency Unit Breakdown (NOS)</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {scoring.competency_summaries?.map((comp: any) => (
            <div key={comp.competency_id} className="py-4 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {comp.nos_code}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{comp.title}</h4>
                </div>

                <div className="text-right flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-800">{comp.achieved_score} / {comp.max_score} ({comp.percentage}%)</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    comp.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {comp.passed ? 'PASS' : 'DEFICIENT'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${comp.passed ? 'bg-emerald-600' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, comp.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <a
          href={assessmentApi.getReportPdfUrl(assessmentId!)}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition"
        >
          <Download className="h-4 w-4 text-blue-400" />
          <span>Download PDF Competency Profile</span>
        </a>

        <Link
          to={`/assessments/${assessmentId}/review`}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition"
        >
          <span>Proceed to Human Assessor Review Decision</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
