import React, { useState, useEffect } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import StatCard from "../components/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { MiniBarChart, DonutChart, LineChart } from "../components/Charts.jsx";
import NotifItem from "../components/NotifItem.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import api from "../api.js";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 40, color: 'red' }}><h1>UI Render Error</h1><pre>{this.state.error.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

const Dashboard = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [stats, setStats] = useState({
    recentDocs: [],
    activeExports: 0,
    documentsReady: 0,
    exportValue: "PKR 0",
    progress: {},
    activeExportDetails: null
  });

  const [topCountries, setTopCountries] = useState([]);
  const [phases, setPhases] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resStats, resCountries, resSettings] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/insights/countries'),
          api.get('/settings')
        ]);
        
        setStats(prev => ({ ...prev, ...resStats.data }));
        
        if (resSettings.data && resSettings.data.exportGuidancePhases) {
          setPhases(resSettings.data.exportGuidancePhases);
        }
        if (resSettings.data && resSettings.data.announcements) {
          setAnnouncements(resSettings.data.announcements);
        }

        if (resCountries.data && resCountries.data.length > 0) {
          const top4 = resCountries.data.slice(0, 4);
          setTopCountries(top4.map(c => ({
            name: c.name,
            value: c.value,
            share: c.demand,
            flag: c.flag
          })));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setApiError(err.toString());
      }
    };
    fetchData();
  }, []);

  const recentCalcs = stats.recentCalculations || [];

  const chartData = stats.chartData || new Array(12).fill(10);

  const pSteps = stats.progress || {};
  let pendingStepsCount = 0;
  let totalStepsCount = 0;
  phases.forEach(phase => {
    (phase.steps || []).forEach(step => {
      totalStepsCount++;
      if (!pSteps[step.title]) {
        pendingStepsCount++;
      }
    });
  });

  const latestCosts = stats.latestEstimateCosts;
  let costSegments = [];
  if (latestCosts) {
    costSegments = [
      { label: "Freight", value: latestCosts.freight, color: "#1E6FD9" },
      { label: "Customs", value: latestCosts.customs, color: "#F59E0B" },
      { label: "Insurance", value: latestCosts.insurance, color: "#10B981" },
      { label: "Docs", value: latestCosts.documentation, color: "#8B5CF6" }
    ];
  }

  return (
    <ErrorBoundary>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <Sidebar active="dashboard" onNavigate={onNavigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div style={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}>
          <TopBar title="Dashboard" onNavigate={onNavigate} />
          <div className="dashboard-content" style={{ padding: "28px" }}>
            {apiError && <div style={{ padding: 16, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, marginBottom: 20 }}>API Fetch Error: {apiError}</div>}
            
            {/* Announcements */}
            {announcements.map((ann, idx) => {
              const bgColors = { info: "#EFF6FF", warning: "#FFFBEB", success: "#ECFDF5", error: "#FEF2F2" };
              const textColors = { info: "#1E6FD9", warning: "#D97706", success: "#059669", error: "#DC2626" };
              const icons = { info: "exclamation", warning: "exclamation", success: "check", error: "x" };
              return (
                <div key={idx} style={{ background: bgColors[ann.type] || bgColors.info, color: textColors[ann.type] || textColors.info, padding: "14px 20px", borderRadius: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, fontWeight: 600, fontSize: 13, border: `1px solid ${textColors[ann.type] || textColors.info}40` }}>
                  <Icon name={icons[ann.type] || "document"} size={18} />
                  {ann.message}
                </div>
              );
            })}

            {/* Welcome bar */}
            <div className="welcome-banner" style={{ background: "linear-gradient(120deg, #0A1628, #1E3A6B)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: "0 0 6px" }}>Welcome back 👋</h2>
                <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>
                  Explore expert guidance and manage your export documents.
                </p>
              </div>
              <button onClick={() => onNavigate("guidance")} style={{ background: "#1E6FD9", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>View Guidance →</button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard icon="document" label="Documents Ready" value={stats.documentsReady} sub={stats.pendingDocs ? `${stats.pendingDocs} pending` : "All clear"} trend={stats.pendingDocs > 0 ? "down" : "up"} color="#10B981" bg="#ECFDF5" />
              <StatCard icon="chart" label="Total Estimates" value={stats.totalEstimates || 0} sub="Calculations run" trend="up" color="#8B5CF6" bg="#F5F3FF" />
              <StatCard icon="academic" label="Pending Guidance" value={`${pendingStepsCount} steps`} sub={`Out of ${totalStepsCount} total`} trend="none" color="#F59E0B" bg="#FFFBEB" />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
              {/* 30 Days Activity Widget */}
              <div style={{ flex: "2 1 400px", background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="activity" size={18} color="#1E6FD9" />
                      Activity Overview
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Volume of calculations over the last 30 days</div>
                  </div>
                  <div style={{ padding: "6px 10px", background: "rgba(30, 111, 217, 0.1)", border: "1px solid rgba(30, 111, 217, 0.2)", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1E6FD9", boxShadow: "0 0 6px #1E6FD9" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1E6FD9", letterSpacing: "0.05em", textTransform: "uppercase" }}>Live</span>
                  </div>
                </div>

                {(!stats.last30DaysActivity || stats.last30DaysActivity.length === 0) ? (
                  <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "20px 0" }}>No data yet.</div>
                ) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <LineChart data={stats.last30DaysActivity} color="#1E6FD9" height={120} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <span>30 Days Ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Calculations Widget */}
              <div style={{ flex: "1 1 300px", background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: 0 }}>Recent Export Calculations</h3>
                  <Icon name="chart" size={20} color="#64748B" />
                </div>

                {recentCalcs.length > 0 ? (
                  <div>
                    {recentCalcs.map((calc, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>{calc.product} <span style={{ color: "#9CA3AF" }}>→</span> {calc.destination}</div>
                          <div style={{ fontSize: 12, color: "#64748B" }}>Calculated on {new Date(calc.date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Estimated Total</div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: "#10B981" }}>PKR {calc.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "30px 20px", textAlign: "center", background: "#F8FAFC", borderRadius: 12, border: "1px dashed #CBD5E1" }}>
                    <Icon name="chart" size={32} color="#94A3B8" />
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "12px 0 4px" }}>No Recent Calculations</h4>
                    <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Run an export cost estimate to see history here.</p>
                  </div>
                )}

                <button onClick={() => onNavigate("estimator")} style={{ marginTop: 16, width: "100%", padding: "12px", background: "#1E6FD9", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s" }} onMouseEnter={(e) => e.target.style.background = "#185BBA"} onMouseLeave={(e) => e.target.style.background = "#1E6FD9"}>
                  + Start New Estimate
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {/* Cost Breakdown */}
              {costSegments.length > 0 && (
                <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: 0 }}>Latest Estimate Breakdown</h3>
                    <Icon name="chart" size={16} color="#9CA3AF" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                    <DonutChart segments={costSegments} size={120} />
                    <div style={{ width: "100%" }}>
                      {costSegments.map(seg => (
                        <div key={seg.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", fontWeight: 500 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color }} />
                            {seg.label}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>PKR {seg.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Documents */}
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: 0 }}>Recent Documents</h3>
                  <span onClick={() => onNavigate("documents")} style={{ fontSize: 12, color: "#1E6FD9", cursor: "pointer", fontWeight: 500 }}>View all →</span>
                </div>
                {stats.recentDocs.length === 0 && <div style={{ fontSize: 13, color: "#9CA3AF" }}>No recent documents.</div>}
                {stats.recentDocs.map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F9FAFB" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#1E6FD9", flexShrink: 0 }}>
                      <Icon name="document" size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.title || doc.name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{new Date(doc.createdAt || doc.date).toLocaleDateString()}</div>
                    </div>
                    <Badge color={doc.color || "blue"}>{doc.status}</Badge>
                  </div>
                ))}
              </div>

              {/* Top Export Countries */}
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: 0 }}>Top Export Destinations</h3>
                  <span onClick={() => onNavigate("insights")} style={{ fontSize: 12, color: "#1E6FD9", cursor: "pointer", fontWeight: 500 }}>Details →</span>
                </div>
                {topCountries.length === 0 && <div style={{ fontSize: 13, color: "#9CA3AF" }}>Loading destinations...</div>}
                {topCountries.map((country, index) => (
                  <div key={country.name + index} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        {country.flag && country.flag.startsWith("http") ? (
                          <img src={country.flag} alt={`${country.name} flag`} style={{ width: 20, height: 14, borderRadius: 2, objectFit: "cover", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }} />
                        ) : (
                          <span style={{ fontSize: 14 }}>{country.flag}</span>
                        )}
                        {country.name}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{country.value}</span>
                    </div>
                    <div style={{ height: 5, background: "#F3F4F6", borderRadius: 8 }}>
                      <div style={{ height: "100%", width: `${country.share}%`, background: "#1E6FD9", borderRadius: 8, transition: "width 1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
