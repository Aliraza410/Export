import React from "react";
import Icon from "./Icon.jsx";
const NotifItem = ({ icon, text, time, color }) => (
  <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #F9FAFB" }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
      <Icon name={icon} size={16} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px", fontWeight: 500, lineHeight: 1.4 }}>{text}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{time}</p>
    </div>
  </div>
);

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export default NotifItem;
