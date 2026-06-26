import React, { useState, useEffect } from "react";
import { GoogleLogin } from '@react-oauth/google';
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import StatCard from "../components/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { MiniBarChart, DonutChart } from "../components/Charts.jsx";
import NotifItem from "../components/NotifItem.jsx";
import api from "../api.js";
const AuthPage = ({ mode, onNavigate }) => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (mode === "login") {
        const res = await api.post('/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        onNavigate(res.data.user.role === 'admin' ? "admin" : "dashboard");
      } else if (mode === "signup") {
        const res = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, company: form.company });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        onNavigate("dashboard");
      } else {
        setTimeout(() => { onNavigate("login"); }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Login failed. Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userData', JSON.stringify(res.data.user));
      onNavigate(res.data.user.role === 'admin' ? "admin" : "dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const titles = { login: "Welcome back", signup: "Start your export journey", forgot: "Reset your password" };
  const subs = { login: "Sign in to your ExportEase account", signup: "Join 1,200+ Pakistani exporters", forgot: "Enter your email to receive reset instructions" };

  return (
    <div className="auth-layout" style={{ minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Left Panel */}
      <div className="auth-left" style={{ background: "linear-gradient(160deg, #0A1628, #0F2952, #0A1628)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 8%", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(30,111,217,0.1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative" }}>
          <div onClick={() => onNavigate("landing")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 56 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1E6FD9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>ExportEase Pakistan</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, color: "white", margin: "0 0 16px", letterSpacing: "-0.02em" }}>Your Export Journey<br />Starts Here</h1>
          <p style={{ fontSize: 15, color: "#94A3B8", margin: "0 0 48px", lineHeight: 1.7 }}>Complete guidance from company registration to international shipment delivery.</p>

          {[["Company Registration", "NTN, STRN & PSW setup"], ["Smart Documentation", "Auto-generate all export docs"], ["Live Tracking", "Real-time shipment updates"]].map(([title, desc]) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{title}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 8%" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div onClick={() => onNavigate("landing")} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 28, padding: "6px 12px", background: "#F1F5F9", borderRadius: 8 }}>
            <span>←</span> Back to Home
          </div>
          <div className="mobile-logo" onClick={() => onNavigate("landing")} style={{ alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1E6FD9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#0A1628" }}>ExportEase</span>
          </div>
          
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0A1628", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{titles[mode]}</h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 32px" }}>{subs[mode]}</p>

          {errorMsg && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 10, fontWeight: 500 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", fontFamily: "inherit", background: "white", color: "#0A1628" }} />
                <input placeholder="Company Name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", fontFamily: "inherit", background: "white", color: "#0A1628" }} />
              </>
            )}
            <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", fontFamily: "inherit", background: "white", color: "#0A1628" }} />
            {mode !== "forgot" && (
              <div style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "white", color: "#0A1628" }} />
                <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                  <Icon name="eye" size={18} />
                </button>
              </div>
            )}
          </div>

          {mode === "login" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <span onClick={() => onNavigate("forgot")} style={{ fontSize: 13, color: "#1E6FD9", cursor: "pointer", fontWeight: 500 }}>Forgot password?</span>
            </div>
          )}

            <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 24, padding: "13px", borderRadius: 10, background: loading ? "#93C5FD" : "#1E6FD9", border: "none", color: "white", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Free Account" : "Send Reset Link"}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
                <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }}></div>
                <span style={{ padding: "0 10px", color: "#9CA3AF", fontSize: 14 }}>or continue with</span>
                <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrorMsg("Google Login Failed")}
                  useOneTap
                />
              </div>
            </>
          )}

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#64748B" }}>
            {mode === "login" && <>Don't have an account? <span onClick={() => onNavigate("signup")} style={{ color: "#1E6FD9", fontWeight: 600, cursor: "pointer" }}>Sign up free</span></>}
            {mode === "signup" && <>Already have an account? <span onClick={() => onNavigate("login")} style={{ color: "#1E6FD9", fontWeight: 600, cursor: "pointer" }}>Sign in</span></>}
            {mode === "forgot" && <><span onClick={() => onNavigate("login")} style={{ color: "#1E6FD9", fontWeight: 600, cursor: "pointer" }}>← Back to sign in</span></>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
export default AuthPage;
