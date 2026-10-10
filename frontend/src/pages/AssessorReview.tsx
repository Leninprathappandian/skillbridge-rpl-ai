import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CheckCircle2, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';

export const AssessorReview: React.FC = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<any>(null);
  const [scoring, setScoring] = useState<any>(null);
  const [decision, setDecision] = useState<string>('approved');
  const [reason, setReason] = useState<string>('Candidate has successfully met all practical competency standards for rooftop solar installation.');
  const [submitting, setSubmitting] = useState<boolean>(false);
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
        console.error("Error loading review:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [assessmentId]);

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Decision reason is required.");
      return;
    }

    setSubmitting(true);
    try {
      await assessmentApi.recordDecision(assessmentId!, decision, reason);
      navigate('/dashboard');
    } catch (err: any) {
      alert("Error saving decision: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !assessment) {
    return <div className="text-center py-12 text-sm text-slate-500">Loading Review Interface...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Authorized Human Assessor Review</h2>
            <p className="text-xs text-slate-500">Record final assessment decision & authorization rationale</p>
          </div>
        </div>

        <span className="text-xs font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
          Assessor: {user?.full_name || 'Sunil Verma'}
        </span>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Worker Candidate: <b className="text-white">{assessment.worker?.full_name || 'Ramesh Kumar'}</b></span>
          <span className="text-blue-400 font-bold">Overall Score: {scoring?.overall_percentage}%</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          QP: {assessment.qualification_pack?.title} ({assessment.qualification_pack?.qp_code})
        </h3>
        <p className="text-xs text-slate-300">
          Recommendation: <b className="text-emerald-400">{scoring?.recommendation}</b>
        </p>
      </div>

      <form onSubmit={handleSubmitDecision} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-900">Record Formal Decision</h3>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase">Select Decision Outcome *</label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              decision === 'approved' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800">APPROVE</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <input
                type="radio"
                name="decision"
                value="approved"
                checked={decision === 'approved'}
                onChange={(e) => setDecision(e.target.value)}
                className="hidden"
              />
              <p className="text-[11px] text-slate-600">Approve candidate for RPL certification recommendation.</p>
            </label>

            <label className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              decision === 'returned' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800">RETURN FOR EVIDENCE</span>
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>
              <input
                type="radio"
                name="decision"
                value="returned"
                checked={decision === 'returned'}
                onChange={(e) => setDecision(e.target.value)}
                className="hidden"
              />
              <p className="text-[11px] text-slate-600">Request additional evidence or missing observations.</p>
            </label>

            <label className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              decision === 'reassessment_requested' ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800">RE-ASSESSMENT</span>
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>
              <input
                type="radio"
                name="decision"
                value="reassessment_requested"
                checked={decision === 'reassessment_requested'}
                onChange={(e) => setDecision(e.target.value)}
                className="hidden"
              />
              <p className="text-[11px] text-slate-600">Request targeted practical re-evaluation of deficient NOS.</p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Decision Reason / Authorization Rationale *
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Record detailed notes on why this decision was reached..."
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500">
          <b>Certification Disclaimer:</b> System assists the assessment process. Recording a decision persists an official RPL Assessment Profile and Recommendation. Final NCVET certification is issued by accredited awarding bodies under MSDE guidelines.
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => navigate(`/assessments/${assessmentId}/results`)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Results
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow transition"
          >
            {submitting ? 'Recording Decision...' : 'Record Assessor Decision'}
          </button>
        </div>
      </form>
    </div>
  );
};
