import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Award, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    setError('');
    try {
      await login(u, p);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex bg-blue-600 p-3 rounded-2xl shadow-lg mb-4 text-white">
          <Award className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          SkillBridge RPL AI
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Ministry of Skill Development & Entrepreneurship (MSDE)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. worker1, assessor1, admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Demo Accounts Quick Login */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-4">
              Demo Accounts Quick Access
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleDemoLogin('worker1', 'worker123')}
                className="flex items-center justify-between p-2.5 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800">Worker (Ramesh)</p>
                  <p className="text-slate-500 text-[10px]">worker1 / worker123</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Worker</span>
              </button>

              <button
                onClick={() => handleDemoLogin('assessor1', 'assessor123')}
                className="flex items-center justify-between p-2.5 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800">Assessor (Sunil)</p>
                  <p className="text-slate-500 text-[10px]">assessor1 / assessor123</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">Assessor</span>
              </button>

              <button
                onClick={() => handleDemoLogin('worker2', 'worker123')}
                className="flex items-center justify-between p-2.5 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800">Worker (Rajesh)</p>
                  <p className="text-slate-500 text-[10px]">worker2 / worker123</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Worker</span>
              </button>

              <button
                onClick={() => handleDemoLogin('admin', 'admin123')}
                className="flex items-center justify-between p-2.5 text-left border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800">System Admin</p>
                  <p className="text-slate-500 text-[10px]">admin / admin123</p>
                </div>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
