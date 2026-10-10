import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentApi } from '../services/api';
import { saveLocalAssessmentDraft, enqueueSyncOperation } from '../offline/db';
import { ShieldAlert, CheckCircle2, Save, ArrowRight } from 'lucide-react';

export const AssessorWorkspace: React.FC = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, { score: number; observations: string; evidence_ref: string; flagged_safety: boolean }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  useEffect(() => {
    async function loadAssessment() {
      setLoading(true);
      try {
        if (!assessmentId) return;
        const data = await assessmentApi.getOne(assessmentId);
        setAssessment(data);

        const initial: Record<string, any> = {};
        if (data.qualification_pack?.competencies) {
          for (const comp of data.qualification_pack.competencies) {
            for (const crit of comp.criteria) {
              initial[crit.id] = {
                score: 8.0,
                observations: 'Candidate demonstrated practical skill during site evaluation.',
                evidence_ref: 'SITE-PHOTO-001.JPG',
                flagged_safety: false
              };
            }
          }
        }
        setScores(initial);
      } catch (err) {
        console.error("Error loading assessment:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId]);

  const handleScoreChange = (critId: string, field: string, val: any) => {
    setScores(prev => ({
      ...prev,
      [critId]: {
        ...prev[critId],
        [field]: val
      }
    }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const resultsPayload = Object.entries(scores).map(([critId, data]) => ({
        criterion_id: critId,
        score: data.score,
        observations: data.observations,
        evidence_ref: data.evidence_ref,
        flagged_safety: data.flagged_safety
      }));

      if (!navigator.onLine) {
        await saveLocalAssessmentDraft(assessmentId!, assessment.worker_id, assessment.qp_id, scores);
        await enqueueSyncOperation('SAVE_RESULT', { assessment_id: assessmentId, results: resultsPayload });
        setToastMsg('Saved offline to local IndexedDB queue! Will sync when online.');
      } else {
        await assessmentApi.updateResults(assessmentId!, resultsPayload, 'in_progress');
        setToastMsg('Draft saved successfully on server!');
      }
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err: any) {
      await saveLocalAssessmentDraft(assessmentId!, assessment.worker_id, assessment.qp_id, scores);
      await enqueueSyncOperation('SAVE_RESULT', { assessment_id: assessmentId, results: scores });
      setToastMsg('Network issue: Saved offline to IndexedDB queue.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    setSaving(true);
    try {
      const resultsPayload = Object.entries(scores).map(([critId, data]) => ({
        criterion_id: critId,
        score: data.score,
        observations: data.observations,
        evidence_ref: data.evidence_ref,
        flagged_safety: data.flagged_safety
      }));

      await assessmentApi.updateResults(assessmentId!, resultsPayload, 'submitted');
      navigate(`/assessments/${assessmentId}/results`);
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !assessment) {
    return <div className="text-center py-12 text-sm text-slate-500">Loading Assessor Workspace...</div>;
  }

  const qp = assessment.qualification_pack;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toastMsg && (
        <div className="bg-emerald-600 text-white font-semibold px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-lg animate-bounce">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {toastMsg}
          </span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Assessment ID: {assessment.id.substring(0, 8)}
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Status: {assessment.status.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            Practical Task Assessment Checklist
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Qualification Pack: <span className="font-semibold text-slate-800">{qp?.title} ({qp?.qp_code})</span> • NSQF Level {qp?.nsqf_level}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button
            onClick={handleSubmitReview}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
          >
            <span>Submit for Scoring</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {qp?.competencies?.map((comp: any) => (
          <div key={comp.id || comp.nos_code} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  NOS: {comp.nos_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{comp.title}</h3>
                <p className="text-xs text-slate-500">{comp.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {comp.criteria?.map((crit: any) => {
                const itemScore = scores[crit.id] || { score: 8.0, observations: '', evidence_ref: '', flagged_safety: false };
                const rubrics = crit.rubric_definitions_json || { "0": "Not demonstrated", "5": "Partial skill", "10": "Proficient" };

                return (
                  <div key={crit.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="font-bold text-sm text-slate-900">{crit.criterion_code}: </span>
                        <span className="text-xs text-slate-700 font-medium">{crit.description}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {crit.is_mandatory && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Mandatory Criterion
                          </span>
                        )}
                        {crit.is_safety_critical && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> Safety Critical
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                      <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">Standardized Rubric Benchmark:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <div><span className="font-bold text-rose-600">0 Points:</span> {rubrics["0"] || "Not demonstrated"}</div>
                        <div><span className="font-bold text-amber-600">5 Points:</span> {rubrics["5"] || "Partial competence"}</div>
                        <div><span className="font-bold text-emerald-600">10 Points:</span> {rubrics["10"] || "Proficient skill"}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                          <span>Score Input:</span>
                          <span className="text-blue-600 font-extrabold text-sm">{itemScore.score} / {crit.max_score}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={crit.max_score}
                          step="1"
                          value={itemScore.score}
                          onChange={(e) => handleScoreChange(crit.id, 'score', parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assessor Observations</label>
                        <input
                          type="text"
                          value={itemScore.observations}
                          onChange={(e) => handleScoreChange(crit.id, 'observations', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                          placeholder="Record key practical observations..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Reference / Photo Code</label>
                        <input
                          type="text"
                          value={itemScore.evidence_ref}
                          onChange={(e) => handleScoreChange(crit.id, 'evidence_ref', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                          placeholder="e.g. IMG-001.JPG or Site Note"
                        />
                      </div>
                    </div>

                    {crit.is_safety_critical && (
                      <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-rose-600" /> Flag Safety Violation / Breach:
                        </span>
                        <input
                          type="checkbox"
                          checked={itemScore.flagged_safety}
                          onChange={(e) => handleScoreChange(crit.id, 'flagged_safety', e.target.checked)}
                          className="h-4 w-4 text-rose-600 rounded border-rose-300"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
