import React from "react";
import Icon from "./Icon.jsx";
const StatCard = ({ icon, label, value, sub, trend, color = "#1E6FD9", bg = "#EFF6FF" }) => (
  <div style={{ background: "white", borderRadius: 16, padding: "20px", border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: trend === "up" ? "#10B981" : trend === "down" ? "#EF4444" : "#9CA3AF", margin: 0, fontWeight: 500 }}>{trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {sub}</p>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        <Icon name={icon} size={22} />
      </div>
    </div>
  </div>
);

// ─── Notification Item ───────────────────────────────────────────────────────
export default StatCard;
