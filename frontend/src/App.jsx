import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import RewritePage from './pages/RewritePage';
import ReportPage from './pages/ReportPage';

// ─── Protected Route Wrapper ─────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <AppLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

// ─── Public Route Wrapper (redirect if already logged in) ───────────────────
const PublicRoute = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return <AppLoader />;
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Full-screen Loader ──────────────────────────────────────────────────────
const AppLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0a0b0f',
    flexDirection: 'column',
    gap: '20px',
  }}>
    {/* Animated REQIFY Logo Loader */}
    <div style={{ position: 'relative' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: '2px solid rgba(201,168,124,0.15)',
        borderTop: '2px solid #c9a87c',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      color: '#8892a4',
      fontSize: '0.875rem',
      letterSpacing: '0.05em',
    }}>
      Loading Reqify...
    </p>
  </div>
);

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <Routes>

            {/* ── Public Routes ── */}
            <Route path="/" element={<LandingPage />} />

            <Route path="/login" element={
              <PublicRoute><LoginPage /></PublicRoute>
            } />

            <Route path="/register" element={
              <PublicRoute><RegisterPage /></PublicRoute>
            } />

            {/* ── Protected Routes ── */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />

            <Route path="/upload" element={
              <ProtectedRoute><UploadPage /></ProtectedRoute>
            } />

            <Route path="/analysis/:id" element={
              <ProtectedRoute><AnalysisPage /></ProtectedRoute>
            } />

            <Route path="/rewrite/:id" element={
              <ProtectedRoute><RewritePage /></ProtectedRoute>
            } />

            <Route path="/report/:id" element={
              <ProtectedRoute><ReportPage /></ProtectedRoute>
            } />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}