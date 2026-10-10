import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { BarChart3, Search, AlertTriangle, Activity } from 'lucide-react';

export const AuditAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const [ov, logs, ev] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getAuditLogs(),
          analyticsApi.getEvaluation()
        ]);
        setOverview(ov);
        setAuditLogs(logs);
        setEvaluation(ev);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-sm text-slate-500">Loading Operational Audit & Analytics...</div>;
  }

  const filteredLogs = auditLogs.filter(log => 
    !actionFilter || log.action.toLowerCase().includes(actionFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Audit Trail & Operational Analytics</h2>
            <p className="text-xs text-slate-500">System Activity Logs • Status Distribution • Inter-Rater Evaluation</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs flex items-start space-x-3 text-blue-950">
        <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-900">Evaluation & Inter-Assessor Agreement Metric Notice</p>
          <p className="mt-0.5">{evaluation?.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total System Registrations</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{overview?.total_workers} Candidates</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Avg Turnaround Time</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{overview?.avg_turnaround_hours} Hours</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">RPL Approval Ratio</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {overview?.total_assessments ? Math.round((overview.approved_assessments / overview.total_assessments) * 100) : 0}%
          </h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <span>Audit Trail Log History</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter action (e.g. LOGIN, SCORE)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Resource</th>
                <th className="p-3">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-blue-800">
                    {log.action}
                  </td>
                  <td className="p-3 font-medium">
                    {log.resource_type} ({log.resource_id?.substring(0, 8) || 'N/A'})
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {log.user_id?.substring(0, 8) || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
