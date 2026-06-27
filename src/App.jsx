import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const ExportGuidance = lazy(() => import("./pages/ExportGuidance.jsx"));
const CostEstimator = lazy(() => import("./pages/CostEstimator.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const CountryInsights = lazy(() => import("./pages/CountryInsights.jsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));

// A simple loading fallback to show while chunks are downloading
const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#F8FAFC" }}>
    <div style={{ width: 40, height: 40, border: "4px solid #E2E8F0", borderTop: "4px solid #1E6FD9", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const navigate = useNavigate();

  // Map the old page strings to routes
  const handleNavigate = (path) => {
    const routeMap = {
      landing: "/",
      login: "/login",
      signup: "/signup",
      forgot: "/forgot",
      dashboard: "/dashboard",
      guidance: "/guidance",
      estimator: "/estimator",
      documents: "/documents",
      insights: "/insights",
      admin: "/admin",
      settings: "/settings",
    };
    navigate(routeMap[path] || `/${path}`);
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage onNavigate={handleNavigate} />} />
          <Route path="/login" element={<AuthPage mode="login" onNavigate={handleNavigate} />} />
          <Route path="/signup" element={<AuthPage mode="signup" onNavigate={handleNavigate} />} />
          <Route path="/forgot" element={<AuthPage mode="forgot" onNavigate={handleNavigate} />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/guidance" element={<ProtectedRoute><ExportGuidance onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/estimator" element={<ProtectedRoute><CostEstimator onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><CountryInsights onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
