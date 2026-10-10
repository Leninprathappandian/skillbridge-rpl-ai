import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workerApi } from '../services/api';
import { UserCheck } from 'lucide-react';

export const WorkerRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    preferred_language: 'English',
    phone: '',
    location: '',
    years_experience: 3.0,
    trade: 'Solar PV Installation & Wiring',
    previous_training: '',
    consent_given: true,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent_given) {
      setError('Consent for data processing is required.');
      return;
    }

    setLoading(true);
    try {
      const worker = await workerApi.register(formData);
      localStorage.setItem('current_worker_id', worker.id);
      navigate('/declaration');
    } catch (err: any) {
      setError(err.message || 'Worker profile registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Worker Candidate Profile</h2>
            <p className="text-xs text-slate-500">Step 1: Enter basic information and practical trade background</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Preferred Language</label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location / District</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Jaipur, Rajasthan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Occupational Trade *</label>
              <select
                value={formData.trade}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Solar PV Installation & Wiring">Solar PV Installation & Wiring</option>
                <option value="Mason Tiling & Substrate Preparation">Mason Tiling & Substrate Preparation</option>
                <option value="Automotive Electrical Rewiring & Diagnosis">Automotive Electrical Rewiring & Diagnosis</option>
                <option value="Domestic Data Entry & Spreadsheet Operation">Domestic Data Entry & Spreadsheet Operation</option>
                <option value="SMAW Structural Welding">SMAW Structural Welding</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Experience (Years) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="40"
                required
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Previous Training / Apprenticeship Details</label>
            <textarea
              rows={2}
              value={formData.previous_training}
              onChange={(e) => setFormData({ ...formData, previous_training: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. 3 years informal apprenticeship under local solar contractor in Jaipur."
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start space-x-3">
            <input
              type="checkbox"
              id="consent"
              checked={formData.consent_given}
              onChange={(e) => setFormData({ ...formData, consent_given: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="consent" className="text-xs text-slate-600 cursor-pointer">
              <span className="font-bold text-slate-800">Consent for Assessment Data Processing:</span> I authorize MSDE and certified RPL assessment agencies to evaluate my declared work experience against official NSQF standards.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition text-sm flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Saving Profile...' : 'Proceed to Self-Declaration Wizard'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
