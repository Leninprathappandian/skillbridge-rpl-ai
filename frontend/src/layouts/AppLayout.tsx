import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, ClipboardCheck, 
  Award, Wifi, WifiOff, LogOut, BarChart3,
  FileText, Cpu, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPendingSyncQueue } from '../offline/db';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    async function checkQueue() {
      try {
        const queue = await getPendingSyncQueue();
        setPendingSyncCount(queue.length);
      } catch (e) {
        // IDB ignore
      }
    }
    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['worker', 'assessor', 'admin'] },
    { label: 'Self Declaration', path: '/declaration', icon: FileText, roles: ['worker'] },
    { label: 'AI Matchpack', path: '/matching', icon: Cpu, roles: ['worker', 'assessor', 'admin'] },
    { label: 'QP Library', path: '/qualifications', icon: BookOpen, roles: ['worker', 'assessor', 'admin'] },
    { label: 'Assessor Workspace', path: '/assessments', icon: ClipboardCheck, roles: ['assessor', 'admin'] },
    { label: 'Offline Sync', path: '/offline', icon: WifiOff, roles: ['worker', 'assessor', 'admin'] },
    { label: 'Audit & Analytics', path: '/analytics', icon: BarChart3, roles: ['assessor', 'admin'] },
  ];

  const filteredNav = navItems.filter(item => !user || item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="bg-blue-600 p-2 rounded-lg font-bold text-white shadow-sm flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                  SkillBridge RPL <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-400/30">AI Pro</span>
                </h1>
                <p className="text-[11px] text-slate-400">MSDE • Smart Education Recognition of Prior Learning</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sync Badge */}
            <Link to="/offline" className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border transition ${
              isOnline 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
                : 'bg-amber-950/40 text-amber-300 border-amber-800 animate-pulse'
            }`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="h-3.5 w-3.5 text-amber-400" />}
              <span className="font-medium hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
              {pendingSyncCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingSyncCount}
                </span>
              )}
            </Link>

            {/* User Profile dropdown */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200">{user.full_name}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-blue-400">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md transition">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-1 sticky top-22">
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation Menu
            </div>
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-4 flex flex-col shadow-xl">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-900">SkillBridge Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded text-slate-400">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="mt-4 space-y-1 flex-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                        isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 Ministry of Skill Development and Entrepreneurship (MSDE). RPL AI Assessment Tool.</p>
          <div className="flex space-x-4">
            <span className="text-slate-400">NSQF Aligned</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Deterministic Scoring v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
