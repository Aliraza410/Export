import React from "react";
const ProgressBar = ({ value, color = "#1E6FD9", label, sublabel }) => (
  <div>
    {(label || sublabel) && (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#6B7280" }}>{sublabel}</span>
      </div>
    )}
    <div style={{ height: 6, background: "#F3F4F6", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 8, transition: "width 1s ease" }} />
    </div>
  </div>
);

// ─── Badge ───────────────────────────────────────────────────────────────────
export default ProgressBar;
