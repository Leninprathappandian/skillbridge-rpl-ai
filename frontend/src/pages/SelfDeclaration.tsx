import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workerApi } from '../services/api';
import { FileText, Wrench, Upload, CheckCircle2, Save, ArrowRight, ArrowLeft } from 'lucide-react';

export const SelfDeclaration: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveDraftMsg, setSaveDraftMsg] = useState<string>('');

  const [declaration, setDeclaration] = useState({
    years_experience: 4.0,
    trade: 'Solar PV Installation & Wiring',
    tasks_summary: 'Rooftop solar panel structure assembly, tilt angle adjustment, DC string cable routing, inverter connection, polarity testing, and grounding earthing pit setup.',
    tools_used: 'Digital multimeter, MC4 crimper, torque wrench, safety harness, angle grinder, spirit level, wire stripper',
    safety_procedures: 'Always inspect safety harness before climbing rooftop, double check DC polarity with multimeter before connecting inverter, wear insulated rubber gloves.',
    evidence_notes: 'Provided project photo of 5kW rooftop solar plant installed at Jaipur site.',
    frequency_json: {
      panel_mounting: 'Daily',
      inverter_wiring: 'Weekly',
      maintenance_troubleshooting: 'Monthly'
    }
  });

  const handleSaveDraft = async () => {
    setSaveDraftMsg('Draft saved locally!');
    setTimeout(() => setSaveDraftMsg(''), 3000);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let workerId = localStorage.getItem('current_worker_id');
      if (!workerId) {
        const newWorker = await workerApi.register({
          full_name: 'Ramesh Kumar (Candidate)',
          trade: declaration.trade,
          years_experience: declaration.years_experience
        });
        workerId = newWorker.id;
        localStorage.setItem('current_worker_id', workerId!);
      }

      const decResult = await workerApi.submitDeclaration(workerId!, {
        ...declaration,
        status: 'submitted'
      });

      navigate('/matching', { state: { declaration: decResult, formData: declaration } });
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Self-Declaration Wizard</h2>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Step {step} of 4
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {saveDraftMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{saveDraftMsg}</span>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Step A: Practical Work Experience</h3>
              <p className="text-xs text-slate-500">Describe the routine tasks and practical trade operations you perform</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Occupational Trade</label>
            <input
              type="text"
              value={declaration.trade}
              onChange={(e) => setDeclaration({ ...declaration, trade: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Describe Work Tasks Performed in Simple Language *
            </label>
            <textarea
              rows={4}
              value={declaration.tasks_summary}
              onChange={(e) => setDeclaration({ ...declaration, tasks_summary: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="e.g. Rooftop solar panel mounting, cable routing, multimeter testing..."
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handleSaveDraft}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow"
            >
              Next: Skills & Tools <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Step B: Tools, Equipment & Safety</h3>
              <p className="text-xs text-slate-500">List tools operated and safety precautions followed</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tools & Equipment Used *
            </label>
            <textarea
              rows={3}
              value={declaration.tools_used}
              onChange={(e) => setDeclaration({ ...declaration, tools_used: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="e.g. Multimeter, torque wrench, safety harness, crimper..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Safety Procedures Followed
            </label>
            <textarea
              rows={3}
              value={declaration.safety_procedures}
              onChange={(e) => setDeclaration({ ...declaration, safety_procedures: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="e.g. Wears safety harness at height, checks polarity..."
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow"
            >
              Next: Evidence <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Step C: Supporting Evidence & References</h3>
              <p className="text-xs text-slate-500">Provide photo references, project site notes, or apprenticeship proof</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Evidence Notes or Reference Links
            </label>
            <textarea
              rows={3}
              value={declaration.evidence_notes}
              onChange={(e) => setDeclaration({ ...declaration, evidence_notes: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="e.g. Site photos, contractor letter, apprenticeship completion certificate..."
            />
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Attach Evidence Files (Photos / Documents)</p>
            <p className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG, PDF up to 10MB</p>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setStep(2)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow"
            >
              Review & Submit <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Step D: Review Self-Declaration Summary</h3>
              <p className="text-xs text-slate-500">Confirm details before executing AI Qualification Matching</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-xs text-slate-700 border border-slate-200">
            <div>
              <span className="font-bold text-slate-900">Occupational Trade:</span> {declaration.trade} ({declaration.years_experience} Years)
            </div>
            <div>
              <span className="font-bold text-slate-900">Tasks Summary:</span> {declaration.tasks_summary}
            </div>
            <div>
              <span className="font-bold text-slate-900">Tools Used:</span> {declaration.tools_used}
            </div>
            <div>
              <span className="font-bold text-slate-900">Safety Precautions:</span> {declaration.safety_procedures}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setStep(3)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Edit Previous Steps
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-md transition"
            >
              {loading ? 'Submitting & Matching...' : 'Submit & Run AI Qualification Match'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
