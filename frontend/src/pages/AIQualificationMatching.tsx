import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { qualApi, assessmentApi, workerApi } from '../services/api';
import { Cpu, AlertTriangle, ArrowRight, Sparkles, BookOpen, Layers } from 'lucide-react';

export const AIQualificationMatching: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQpId, setSelectedQpId] = useState<string>('');
  const [creatingAss, setCreatingAss] = useState<boolean>(false);

  const declaration = location.state?.declaration;
  const formData = location.state?.formData || {
    trade: 'Solar PV Installation & Wiring',
    tasks_summary: 'Rooftop solar panel structure assembly, DC cable stringing, inverter mounting, multimeter testing, and earthing pit connection.',
    tools_used: 'Multimeter, MC4 crimping tool, torque wrench, safety harness',
    years_experience: 4.0
  };

  useEffect(() => {
    async function runMatching() {
      setLoading(true);
      try {
        const res = await qualApi.match({
          trade: formData.trade,
          tasks_summary: formData.tasks_summary,
          tools_used: formData.tools_used,
          years_experience: formData.years_experience
        });
        setMatchData(res);
        if (res.suggestions?.length > 0) {
          setSelectedQpId(res.suggestions[0].qp_id);
        }
      } catch (err) {
        console.error("Match error:", err);
      } finally {
        setLoading(false);
      }
    }
    runMatching();
  }, []);

  const handleConfirmQualification = async (qpId: string) => {
    setCreatingAss(true);
    try {
      let workerId = localStorage.getItem('current_worker_id');
      if (!workerId) {
        const newW = await workerApi.register({
          full_name: 'Ramesh Kumar (Candidate)',
          trade: formData.trade,
          years_experience: formData.years_experience
        });
        workerId = newW.id;
      }

      const assessment = await assessmentApi.create(workerId!, qpId, declaration?.id);
      navigate(`/assessments/${assessment.id}/eval`);
    } catch (err: any) {
      alert("Assessment creation error: " + err.message);
    } finally {
      setCreatingAss(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <Cpu className="h-10 w-10 text-blue-600 animate-pulse" />
        <p className="text-sm font-semibold text-slate-700">Running AI Semantic Qualification Matching Pipeline...</p>
        <p className="text-xs text-slate-500">Searching official MSDE NCVET Qualification Register</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">AI Model-Generated Relevance Signal Notice</p>
          <p className="mt-0.5">{matchData?.disclaimer}</p>
        </div>
      </div>

      {/* Summary Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
            <Sparkles className="h-3.5 w-3.5" /> {matchData?.model_info}
          </span>
          <h2 className="text-xl font-bold text-slate-900">Ranked NSQF Qualification Suggestions</h2>
          <p className="text-xs text-slate-500 mt-1">Based on self-declared trade: "{formData.trade}" ({formData.years_experience} Yrs Experience)</p>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {matchData?.suggestions?.map((item: any, index: number) => {
          const isSelected = selectedQpId === item.qp_id;
          return (
            <div
              key={item.qp_id}
              className={`bg-white rounded-2xl border transition-all p-6 shadow-sm ${
                isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                      #{index + 1} Match
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {item.qp_code}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      NSQF Level {item.nsqf_level} (v{item.version})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{item.title}</h3>
                  <p className="text-xs font-medium text-slate-500">{item.sector} Sector</p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-sm">
                    <span>Relevance: Math {(item.match_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Matching Explanation: </span>
                  <span className="text-slate-600">{item.explanation}</span>
                </div>

                {item.matching_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs font-semibold text-slate-700 mr-1">Matched Keywords:</span>
                    {item.matching_skills.map((skill: string, i: number) => (
                      <span key={i} className="bg-slate-100 text-slate-800 text-[11px] font-medium px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {item.matched_competencies?.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-blue-600" /> Matched NOS Competencies:
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {item.matched_competencies.map((c: string, idx: number) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.uncertainties?.length > 0 && (
                  <div className="bg-amber-50 p-2.5 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>{item.uncertainties.join(' ')}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => navigate(`/qualifications/${item.qp_id}`)}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                >
                  <BookOpen className="h-4 w-4" /> View Full QP Details
                </button>

                <button
                  onClick={() => handleConfirmQualification(item.qp_id)}
                  disabled={creatingAss}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                >
                  <span>Confirm Qualification & Launch Checklist</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
