import React from "react";
const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
    green: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
    amber: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    red: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
    slate: { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
    emerald: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
    navy: { bg: "#EEF2FF", text: "#3730A3", border: "#C7D2FE" },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: "0.02em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
export default Badge;
