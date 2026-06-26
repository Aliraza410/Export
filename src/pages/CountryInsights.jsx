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

const CountryInsights = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await api.get('/insights/countries');
        setAllCountries(res.data);
      } catch (err) {
        console.error("Failed to fetch live countries from backend", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const filteredCountries = allCountries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 24);

  const opportunities = allCountries.length >= 3 ? [
    { 
      icon: "trending", 
      title: `${allCountries[0].category.split(',')[0]} to ${allCountries[0].name}`, 
      desc: `High demand surge in ${allCountries[0].name} with a GDP of ${allCountries[0].value}. Strong market potential for exports.`, 
      color: "#10B981" 
    },
    { 
      icon: "academic", 
      title: `${allCountries[1].category.split(',')[0]} — ${allCountries[1].name}`, 
      desc: `${allCountries[1].name} is a rapidly growing market. Simulated demand score of ${allCountries[1].demand}/100 indicates high margins.`, 
      color: "#8B5CF6" 
    },
    { 
      icon: "globe", 
      title: `General Goods — ${allCountries[2].name}`, 
      desc: `Seeking alternative suppliers. Goods have strong potential in ${allCountries[2].name} (${allCountries[2].growth} simulated YoY Growth).`, 
      color: "#1E6FD9" 
    },
  ] : [
    { icon: "trending", title: "Loading...", desc: "Fetching latest market opportunities...", color: "#10B981" },
    { icon: "academic", title: "Loading...", desc: "Fetching latest market opportunities...", color: "#8B5CF6" },
    { icon: "globe", title: "Loading...", desc: "Fetching latest market opportunities...", color: "#1E6FD9" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Sidebar active="insights" onNavigate={onNavigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, overflow: "auto" }}>
        <TopBar title="Live Country Insights" onNavigate={onNavigate} />
        <div style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: 0 }}>Global Export Markets</h3>
            <input 
              type="text" 
              placeholder="Search countries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E2E8F0", outline: "none", width: 280, fontSize: 13, fontFamily: "inherit" }}
            />
          </div>

          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#64748B", fontSize: 14, fontWeight: 500 }}>Loading live global country data...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
              {filteredCountries.map(c => (
              <div key={c.name} onClick={() => setSelected(selected?.name === c.name ? null : c)} style={{ background: selected?.name === c.name ? "#0A1628" : "white", borderRadius: 14, padding: 18, border: `1.5px solid ${selected?.name === c.name ? "#1E6FD9" : "#E5E7EB"}`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  {c.flag && c.flag.startsWith("http") ? (
                    <img src={c.flag} alt={`${c.name} flag`} style={{ width: 40, height: 28, borderRadius: 4, objectFit: "cover", border: "1px solid #E2E8F0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }} />
                  ) : (
                    <span style={{ fontSize: 28 }}>{c.flag}</span>
                  )}
                  <Badge color="green">{c.growth}</Badge>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected?.name === c.name ? "white" : "#0A1628", marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: selected?.name === c.name ? "#64748B" : "#9CA3AF", marginBottom: 12 }}>{c.category}</div>
                <div style={{ height: 4, background: selected?.name === c.name ? "rgba(255,255,255,0.1)" : "#F1F5F9", borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${c.demand}%`, background: c.color, borderRadius: 8 }} />
                </div>
                <div style={{ fontSize: 12, color: selected?.name === c.name ? "#94A3B8" : "#9CA3AF" }}>Demand Score: {c.demand}/100</div>
              </div>
            ))}
            </div>
          )}

          {selected && (
            <div style={{ background: "linear-gradient(135deg, #0A1628, #1A2E52)", borderRadius: 16, padding: 28, marginBottom: 24, border: "1px solid #1E3A6B" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    {selected.flag && selected.flag.startsWith("http") ? (
                      <img src={selected.flag} alt={`${selected.name} flag`} style={{ width: 64, height: 44, borderRadius: 6, objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                    ) : (
                      <span style={{ fontSize: 36 }}>{selected.flag}</span>
                    )}
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>{selected.name}</h3>
                      <div style={{ fontSize: 13, color: "#94A3B8" }}>Export Market Analysis</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}><Icon name="x" size={20} /></button>
              </div>
              <div className="grid-4" style={{ gap: 16, marginTop: 20 }}>
                {[["Demand Score", `${selected.demand}/100`], ["YoY Growth", selected.growth], ["Export Value", selected.value], ["Top Products", selected.category]].map(([l, v]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>Demand Trend (8 months)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                  {selected.trend.map((v, i) => (
                    <div key={i} style={{ flex: 1, background: selected.color, opacity: 0.3 + (i / selected.trend.length) * 0.7, borderRadius: "3px 3px 0 0", height: `${(v / 100) * 100}%`, transition: "height 0.6s ease" }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Opportunities */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: "0 0 16px" }}>🔥 Hot Export Opportunities</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {opportunities.map((opp, index) => (
                <div key={index} style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #F1F5F9", display: "flex", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: opp.color + "15", display: "flex", alignItems: "center", justifyContent: "center", color: opp.color, flexShrink: 0 }}>
                    <Icon name={opp.icon} size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", marginBottom: 6 }}>{opp.title}</div>
                    <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{opp.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
export default CountryInsights;
