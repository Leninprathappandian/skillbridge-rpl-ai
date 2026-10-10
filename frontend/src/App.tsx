import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WorkerRegistration } from './pages/WorkerRegistration';
import { SelfDeclaration } from './pages/SelfDeclaration';
import { AIQualificationMatching } from './pages/AIQualificationMatching';
import { QualificationPackLibrary } from './pages/QualificationPackLibrary';
import { AssessorWorkspace } from './pages/AssessorWorkspace';
import { ScoringResults } from './pages/ScoringResults';
import { AssessorReview } from './pages/AssessorReview';
import { OfflineSync } from './pages/OfflineSync';
import { AuditAnalytics } from './pages/AuditAnalytics';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-600">Loading SkillBridge RPL Session...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/workers/register" element={<ProtectedRoute><WorkerRegistration /></ProtectedRoute>} />
          <Route path="/declaration" element={<ProtectedRoute><SelfDeclaration /></ProtectedRoute>} />
          <Route path="/matching" element={<ProtectedRoute><AIQualificationMatching /></ProtectedRoute>} />
          <Route path="/qualifications" element={<ProtectedRoute><QualificationPackLibrary /></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/assessments/:id/eval" element={<ProtectedRoute><AssessorWorkspace /></ProtectedRoute>} />
          <Route path="/assessments/:id/results" element={<ProtectedRoute><ScoringResults /></ProtectedRoute>} />
          <Route path="/assessments/:id/review" element={<ProtectedRoute><AssessorReview /></ProtectedRoute>} />
          <Route path="/offline" element={<ProtectedRoute><OfflineSync /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AuditAnalytics /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
