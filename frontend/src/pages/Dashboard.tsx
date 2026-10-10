import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentApi, analyticsApi } from '../services/api';
import { 
  Users, ClipboardList, CheckCircle2, Clock, 
  ShieldCheck, ChevronRight, Award, PlusCircle, RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const assList = await assessmentApi.list();
        setAssessments(assList);

        if (user?.role === 'admin' || user?.role === 'assessor') {
          const overview = await analyticsApi.getOverview();
          setAnalytics(overview);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#9333EA'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm text-slate-600 font-medium">Loading Dashboard Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-400/20">
            {user?.role} Portal
          </span>
          <h2 className="text-2xl font-bold mt-2 tracking-tight">Welcome, {user?.full_name}</h2>
          <p className="text-sm text-slate-300 mt-1">
            Recognition of Prior Learning (RPL) AI Assessment System • MSDE
          </p>
        </div>
        {user?.role === 'worker' && (
          <Link
            to="/declaration"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Self-Declaration</span>
          </Link>
        )}
      </div>

      {/* WORKER DASHBOARD */}
      {user?.role === 'worker' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <span>Assessment Journey Progress</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase mb-2">
                  <span>Step 1: Declaration</span>
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600">Submit work experience, skills, and tools used.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase mb-2">
                  <span>Step 2: AI Matching</span>
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600">Semantic match to official NSQF Qualification Packs.</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase mb-2">
                  <span>Step 3: Evaluation</span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-xs text-slate-600">Assessor checks practical task checklist & safety criteria.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase mb-2">
                  <span>Step 4: Report</span>
                  <Award className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-600">Generate & download validated competency profile.</p>
              </div>
            </div>
          </div>

          {/* Active Assessments Table for Worker */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Your Assessments</h3>
            {assessments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No active assessment found. Click "New Self-Declaration" to start!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assessments.map((ass) => (
                  <div key={ass.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        ID: {ass.id.substring(0, 8)}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {ass.qualification_pack?.title || 'Qualification Match Pending'}
                      </h4>
                      <p className="text-xs text-slate-500">Updated: {new Date(ass.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        ass.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        ass.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ass.status}
                      </span>
                      <Link
                        to={`/assessments/${ass.id}/results`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>View Results</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSESSOR / ADMIN STATS CARDS */}
      {(user?.role === 'assessor' || user?.role === 'admin') && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Workers</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.total_workers}</h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assessments</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.total_assessments}</h3>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Reviews</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{analytics.pending_reviews}</h3>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved RPL</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{analytics.approved_assessments}</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Assessor / Admin Main Workspace Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">Assigned Assessments</h3>
                <Link to="/assessments" className="text-xs font-semibold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {assessments.slice(0, 5).map((ass) => (
                  <div key={ass.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {ass.worker?.full_name || 'Ramesh Kumar'}
                      </p>
                      <p className="text-xs text-slate-500">
                        QP: {ass.qualification_pack?.qp_code} - {ass.qualification_pack?.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        ass.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ass.status}
                      </span>
                      <Link
                        to={`/assessments/${ass.id}/eval`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Evaluate
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <h3 className="text-base font-bold text-slate-900 mb-2">Trade Coverage</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.assessments_by_trade || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {Object.keys(analytics.assessments_by_trade || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
