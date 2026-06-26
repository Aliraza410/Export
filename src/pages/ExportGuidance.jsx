import React, { useState, useEffect } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import StatCard from "../components/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { MiniBarChart, DonutChart } from "../components/Charts.jsx";
import NotifItem from "../components/NotifItem.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";

import api from "../api.js";

const ExportGuidance = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [expandedStep, setExpandedStep] = useState(null);
  const [phases, setPhases] = useState([]);
  const [resourceLinks, setResourceLinks] = useState({});
  const [toast, setToast] = useState(null);
  const [activeExport, setActiveExport] = useState(null);
  const [allExports, setAllExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, exportsRes, settingsRes] = await Promise.all([
          api.get('/progress/guidance'),
          api.get('/exports'),
          api.get('/settings')
        ]);

        const fetchedSettings = settingsRes.data || {};
        const basePhases = fetchedSettings.exportGuidancePhases || [];
        setResourceLinks(fetchedSettings.resourceLinks || {});

        const dbSteps = progRes.data.steps || {};
        setPhases(basePhases.map(p => ({
          ...p,
          steps: (p.steps || []).map(s => ({
            ...s,
            done: dbSteps[s.title] === true
          }))
        })));

        const exportsData = exportsRes.data || [];
        setAllExports(exportsData);

        const active = exportsData.find(e => e.status === "Active" || e.status === "Pending") || exportsData[0];
        setActiveExport(active || null);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleStep = async (phaseIndex, stepIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex] = { ...newPhases[phaseIndex] };
    newPhases[phaseIndex].steps = [...newPhases[phaseIndex].steps];

    const step = newPhases[phaseIndex].steps[stepIndex];
    step.done = !step.done;
    setPhases(newPhases);

    try {
      const stepsMap = {};
      newPhases.forEach(p => p.steps.forEach(s => {
        if (s.done) stepsMap[s.title] = true;
      }));
      await api.post('/progress/guidance', { steps: stepsMap });
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const phase = phases[activePhase];

  const totalSteps = phases.reduce((acc, p) => acc + p.steps.length, 0);
  const completedSteps = phases.reduce((acc, p) => acc + p.steps.filter(s => s.done).length, 0);
  const overallProgress = Math.round((completedSteps / totalSteps) * 100) || 0;

  let nextActionPhase = null;
  let nextActionStep = null;
  let nextActionPhaseIndex = 0;
  let nextActionStepIndex = 0;
  for (let i = 0; i < phases.length; i++) {
    const incompleteStepIndex = phases[i].steps.findIndex(s => !s.done);
    if (incompleteStepIndex !== -1) {
      nextActionPhase = phases[i];
      nextActionStep = phases[i].steps[incompleteStepIndex];
      nextActionPhaseIndex = i;
      nextActionStepIndex = incompleteStepIndex;
      break;
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Sidebar active="guidance" onNavigate={onNavigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, overflow: "auto" }}>
        <TopBar title="Export Guidance" onNavigate={onNavigate} />
        <div style={{ padding: isMobile ? "16px" : "28px" }}>
          {/* Global Progress Bar */}
          <div style={{ background: "white", borderRadius: 16, padding: isMobile ? "20px" : "20px 24px", border: "1px solid #F1F5F9", marginBottom: 24, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 24 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Export Journey</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#0A1628" }}>{overallProgress}% Complete</div>
            </div>
            <div style={{ flex: 1, width: "100%" }}>
              <div style={{ height: 12, background: "#F1F5F9", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${overallProgress}%`, background: "linear-gradient(90deg, #1E6FD9, #10B981)", borderRadius: 12, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 8, textAlign: "right", fontWeight: 500 }}>
                {completedSteps} of {totalSteps} total steps completed
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid-1-300" style={{ gap: 24, marginTop: 24 }}>
            {/* Left: Vertical Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {phases.map((p, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {/* Vertical Line Connector */}
                  {i < phases.length - 1 && !isMobile && (
                    <div style={{ position: "absolute", left: 24, top: 50, bottom: -40, width: 2, background: "#E5E7EB", zIndex: 1 }} />
                  )}

                  <div style={{ display: "flex", gap: isMobile ? 0 : 20, position: "relative", zIndex: 2 }}>
                    {!isMobile && (
                      <div style={{ width: 50, height: 50, borderRadius: "50%", background: p.steps.every(s => s.done) ? p.color : "white", border: `2px solid ${p.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: p.steps.every(s => s.done) ? "white" : p.color, fontWeight: 800, fontSize: 16, boxShadow: nextActionPhaseIndex === i ? `0 0 0 4px ${p.color}20` : "none" }}>
                        {p.num}
                      </div>
                    )}

                    {/* Phase Content */}
                    <div style={{ flex: 1, paddingBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 8px", paddingTop: isMobile ? 0 : 10 }}>
                        {isMobile && (
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.steps.every(s => s.done) ? p.color : "white", border: `2px solid ${p.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: p.steps.every(s => s.done) ? "white" : p.color, fontWeight: 800, fontSize: 13, boxShadow: nextActionPhaseIndex === i ? `0 0 0 3px ${p.color}20` : "none" }}>
                            {p.num}
                          </div>
                        )}
                        <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: "#0A1628", margin: 0 }}>{p.title}</h2>
                      </div>
                      <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>{p.steps.filter(s => s.done).length} of {p.steps.length} steps completed</p>

                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {p.steps.map((step, idx) => {
                          const isActiveAction = nextActionPhaseIndex === i && nextActionStepIndex === idx;
                          const isExpanded = expandedStep === `${i}-${idx}`;

                          return (
                            <div key={step.title} style={{ background: "white", border: `1px solid ${isActiveAction ? p.color : "#F1F5F9"}`, borderRadius: 12, overflow: "hidden", boxShadow: isActiveAction ? `0 4px 12px ${p.color}15` : "none", transition: "all 0.3s" }}>
                              <button onClick={() => setExpandedStep(expandedStep === `${i}-${idx}` ? null : `${i}-${idx}`)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px", background: step.done ? "#FAFBFF" : "white", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: step.done ? p.color : "white", border: `2px solid ${step.done ? p.color : "#D1D5DB"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {step.done ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D1D5DB", display: "inline-block" }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0A1628" }}>{step.title}</div>
                                </div>
                                {isActiveAction && <Badge color="orange">Action Required</Badge>}
                                <Icon name="chevronDown" size={18} style={{ color: "#9CA3AF", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                              </button>

                              {isExpanded && (
                                <div style={{ padding: isMobile ? "0 16px 16px" : "0 16px 20px", borderTop: `1px solid #F1F5F9` }}>
                                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "16px 0", paddingLeft: isMobile ? 0 : 42 }}>{step.desc}</p>
                                  <div style={{ paddingLeft: isMobile ? 0 : 42, marginBottom: 20 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resources & Documents</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                      {step.docs.map(doc => {
                                        const isExternal = !!resourceLinks[doc];
                                        return (
                                          <a
                                            key={doc}
                                            href={isExternal ? resourceLinks[doc] : `http://localhost:5000/api/documents/template/${encodeURIComponent(doc)}?t=${Date.now()}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#1E6FD9", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textDecoration: "none" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                                            onMouseLeave={e => e.currentTarget.style.background = "#F8FAFC"}
                                          >
                                            <Icon name="document" size={14} />
                                            {doc} {isExternal ? "(View Portal)" : "(Download)"}
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div style={{ paddingLeft: isMobile ? 0 : 42 }}>
                                    <button onClick={() => toggleStep(i, idx)} style={{ width: isMobile ? "100%" : "auto", padding: "10px 24px", background: step.done ? "#F1F5F9" : p.color, color: step.done ? "#475569" : "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s" }}>
                                      {step.done ? "Undo (Mark Incomplete)" : "Complete Step"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "white", borderRadius: 16, padding: "30px 24px", border: "1px solid #F1F5F9", textAlign: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: "0 0 24px" }}>Journey Progress</h3>
                <div style={{ width: 160, height: 160, margin: "0 auto 24px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DonutChart segments={[{ name: "Completed", value: overallProgress, color: "#10B981" }, { name: "Remaining", value: 100 - overallProgress, color: "#F1F5F9" }]} size={160} />
                  <div style={{ position: "absolute", fontSize: 24, fontWeight: 900, color: "#0A1628" }}>{overallProgress}%</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", background: "#F8FAFC", padding: "12px 16px", borderRadius: 12 }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Completed</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0A1628" }}>{completedSteps} <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF" }}>steps</span></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Remaining</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0A1628" }}>{totalSteps - completedSteps} <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF" }}>steps</span></div>
                  </div>
                </div>
              </div>

              {nextActionPhase && nextActionStep && (
                <div style={{ background: nextActionPhase.bg, borderRadius: 16, padding: 24, border: `1px solid ${nextActionPhase.color}40` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Icon name="info" size={18} style={{ color: nextActionPhase.color }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: nextActionPhase.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Action Required</span>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: "0 0 8px" }}>{nextActionStep.title}</h4>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>{nextActionStep.desc.split('.')[0]}.</p>
                  <button onClick={() => {
                    setExpandedStep(`${nextActionPhaseIndex}-${nextActionStepIndex}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} style={{ width: "100%", padding: "12px", background: nextActionPhase.color, color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                    Continue to Step →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", background: "#0A1628", color: "white", padding: "12px 24px", borderRadius: 30, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", zIndex: 9999, display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="checkCircle" size={18} style={{ color: "#10B981" }} />
          {toast}
        </div>
      )}
    </div>
  );
};

// ─── COST ESTIMATOR ───────────────────────────────────────────────────────────
export default ExportGuidance;
