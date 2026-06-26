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

const SearchableSelect = ({ value, onChange, options, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = React.useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        {icon && <div style={{ position: "absolute", left: 14, top: 10, color: "#64748B", display: "flex", alignItems: "center" }}>{icon}</div>}
        <input 
          type="text" 
          value={query} 
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onClick={(e) => { e.target.select(); setIsOpen(true); }}
          placeholder={placeholder}
          style={{ width: "100%", padding: `10px 36px 10px ${icon ? '40px' : '14px'}`, borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = "#1E6FD9"; e.target.select(); setIsOpen(true); }}
          onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; }}
        />
        {query && (
          <div 
            onClick={(e) => { e.stopPropagation(); setQuery(""); onChange(""); setIsOpen(true); }}
            style={{ position: "absolute", right: 12, top: 11, color: "#9CA3AF", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, background: "#F1F5F9", borderRadius: "50%", fontWeight: "bold" }}
          >
            ✕
          </div>
        )}
      </div>
      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "white", borderRadius: 10, border: "1px solid #E2E8F0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", maxHeight: 220, overflowY: "auto", zIndex: 100 }}>
          {filtered.length > 0 ? filtered.map((opt, i) => (
            <div 
              key={i}
              onClick={() => {
                onChange(opt.value);
                setQuery(opt.label);
                setIsOpen(false);
              }}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: i !== filtered.length - 1 ? "1px solid #F1F5F9" : "none", transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {opt.icon && <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{opt.icon}</span>}
              <span style={{ fontSize: 14, color: "#0A1628", fontWeight: 500 }}>{opt.label}</span>
            </div>
          )) : (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#64748B", fontStyle: "italic" }}>Use "{query}" as custom...</div>
          )}
        </div>
      )}
    </div>
  );
};

const CostEstimator = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [form, setForm] = useState({ product: "", qty: "", destination: "", shipping: "" });
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [calculatedForm, setCalculatedForm] = useState(null);
  
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await api.get('/insights/countries');
        setCountries(res.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    };
    fetchCountries();
  }, []);

  const categoryOptions = [
    { label: "Basmati Rice", value: "Rice", icon: "🌾" },
    { label: "Textiles & Garments", value: "Textiles", icon: "👕" },
    { label: "Spices & Food", value: "Spices", icon: "🌶️" },
    { label: "Leather Goods", value: "Leather Goods", icon: "👞" },
    { label: "Sports Goods", value: "Sports Goods", icon: "⚽" },
    { label: "Surgical Instruments", value: "Surgical Instruments", icon: "⚕️" },
    { label: "Electronics", value: "Electronics", icon: "💻" },
    { label: "Furniture", value: "Furniture", icon: "🪑" },
    { label: "Machinery", value: "Machinery", icon: "⚙️" },
    { label: "Cosmetics", value: "Cosmetics", icon: "✨" },
  ];

  const countryOptions = countries.map(c => ({
    label: c.name,
    value: c.name,
    icon: c.flag && c.flag.startsWith("http") ? <img src={c.flag} alt="flag" style={{ width: 20, height: 14, borderRadius: 2, objectFit: "cover", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} /> : <span style={{fontSize: 16}}>{c.flag}</span>
  }));

  const [result, setResult] = useState({
    costs: { freight: 0, customs: 0, documentation: 0, insurance: 0 },
    total: 0,
    cargoValue: 0,
    tips: []
  });

  const handleCalculate = async () => {
    if (!form.product || !form.qty || !form.destination || !form.shipping) {
      alert("Please fill in all fields before calculating.");
      return;
    }
    
    setLoading(true);
    setCalculated(false);
    try {
      const res = await api.post('/estimator/calculate', form);
      setResult(res.data);
      setCalculatedForm({ ...form });
      setCalculated(true);

      // Auto-save the estimate to their history
      try {
        await api.post('/exports', {
          product: form.product,
          qty: form.qty,
          destination: form.destination,
          shipping: form.shipping,
          totalCost: res.data.total
        });
      } catch (saveErr) {
        console.error("Failed to save estimate to history", saveErr);
      }
    } catch (err) {
      console.error("Failed to calculate cost", err);
      alert("Failed to connect to backend for live calculation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Sidebar active="estimator" onNavigate={onNavigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}>
        <TopBar title="Cost Estimator" onNavigate={onNavigate} />
        <div className="dashboard-content" style={{ padding: "28px" }}>
          
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0A1628", margin: "0 0 8px" }}>Live Export Cost Estimator</h2>
            <p style={{ fontSize: 15, color: "#64748B", margin: 0 }}>Get instant, real-time freight and tariff estimates based on global market rates.</p>
          </div>

          <div className="grid-2-1" style={{ gap: 24 }}>
            {/* Input Form */}
            <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Product Category</label>
                  <SearchableSelect 
                    value={form.product} 
                    onChange={(val) => setForm({ ...form, product: val })} 
                    options={categoryOptions}
                    placeholder="Search or enter product..."
                    icon={<Icon name="package" size={18} />}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Total Quantity (kg)</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 14, top: 11, color: "#64748B" }}><Icon name="trending" size={18} /></div>
                    <input 
                      type="number" 
                      value={form.qty} 
                      onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                      placeholder="e.g. 5000"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                      onFocus={(e) => { e.target.style.borderColor = "#1E6FD9"; e.target.select(); }}
                      onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Destination Country</label>
                  <SearchableSelect 
                    value={form.destination} 
                    onChange={(val) => setForm({ ...form, destination: val })} 
                    options={countryOptions}
                    placeholder="Search country..."
                    icon={<Icon name="globe" size={18} />}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Shipping Mode</label>
                  <div className="grid-2" style={{ gap: 10 }}>
                    {[["sea", "🚢 Sea Freight", "Economical • 15–25 days"], ["air", "✈️ Air Freight", "Fast • 2–5 days"]].map(([val, label, sub]) => (
                      <button key={val} onClick={() => setForm({ ...form, shipping: val })} style={{ padding: "12px", border: `2px solid ${form.shipping === val ? "#1E6FD9" : "#E5E7EB"}`, borderRadius: 10, background: form.shipping === val ? "#EFF6FF" : "white", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0A1628" }}>{label}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleCalculate} disabled={loading} style={{ width: "100%", padding: "13px", background: "#1E6FD9", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Fetching Live Rates..." : "Calculate Export Cost →"}
                </button>
              </div>
            </div>

            {/* Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: calculated ? "linear-gradient(135deg, #0A1628, #1E3A6B)" : "#F8FAFC", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9", minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "center", transition: "background 0.5s" }}>
                {loading ? (
                  <div style={{ textAlign: "center", color: "#64748B" }}>
                    <div style={{ fontSize: 24, marginBottom: 12 }}>🔄</div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Fetching live freight rates & tariffs...</p>
                  </div>
                ) : calculated ? (
                  <>
                    <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Estimated Export Cost</div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: "white", letterSpacing: "-0.03em" }}>PKR {result.total.toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>For {calculatedForm?.qty.toLocaleString()} kg via {calculatedForm?.shipping === "sea" ? "sea freight" : "air freight"}</div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "#9CA3AF" }}>
                    <Icon name="currency" size={40} />
                    <p style={{ marginTop: 12, fontSize: 14 }}>Configure your export details and click calculate</p>
                  </div>
                )}
              </div>

              {calculated && (
                <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: "0 0 18px" }}>Cost Breakdown</h3>
                  {[
                    { label: "Freight & Logistics", value: result.costs.freight, color: "#1E6FD9", pct: (result.costs.freight / result.total * 100).toFixed(0) },
                    { label: "Customs Duties & Taxes", value: result.costs.customs, color: "#10B981", pct: (result.costs.customs / result.total * 100).toFixed(0) },
                    { label: "Documentation & Compliance", value: result.costs.documentation, color: "#F59E0B", pct: (result.costs.documentation / result.total * 100).toFixed(0) },
                    { label: "Insurance", value: result.costs.insurance, color: "#8B5CF6", pct: (result.costs.insurance / result.total * 100).toFixed(0) },
                  ].map(item => (
                    <div key={item.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: "#374151" }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>PKR {item.value.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 5, background: "#F3F4F6", borderRadius: 8 }}>
                        <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {calculated && result.tips.length > 0 && (
                <div style={{ background: "#F0FDF4", borderRadius: 16, padding: 20, border: "1px solid #BBF7D0" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ color: "#10B981", flexShrink: 0, marginTop: 2 }}><Icon name="info" size={16} /></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 6 }}>Live Insights & Tips</div>
                      <ul style={{ fontSize: 12, color: "#166534", lineHeight: 1.7, margin: 0, paddingLeft: 16 }}>
                        {result.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {calculated && (
                <button 
                  onClick={() => onNavigate('guidance')}
                  style={{ width: "100%", padding: "16px", background: "#0F172A", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1E293B"}
                  onMouseLeave={e => e.currentTarget.style.background = "#0F172A"}
                >
                  Proceed to Guidance Journey →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEstimator;
