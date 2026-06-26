import React, { useState, useEffect } from "react";
import Icon from "./Icon.jsx";
import Badge from "./Badge.jsx";
import NotifItem from "./NotifItem.jsx";
import api from "../api.js";

const TopBar = ({ title, onNavigate }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
      } catch (err) {
        console.error("Failed to fetch user details", err);
      }
    };
    fetchUser();
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    onNavigate("landing");
  };

  return (
    <div className="topbar-container" style={{ height: 60, background: "white", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 50 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0A1628", margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => onNavigate("settings")} style={{ width: 38, height: 38, borderRadius: 10, background: "#F8FAFC", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151" }}>
            <Icon name="settings" size={18} />
          </button>
        </div>
        <div style={{ position: "relative" }}>
          <div onClick={() => { setProfileOpen(!profileOpen); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "#1E6FD9", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", overflow: "hidden" }}>
            {user?.profilePic ? (
              <img src={user.profilePic.startsWith('http') ? user.profilePic : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.profilePic.startsWith('/') ? '' : '/'}${user.profilePic}`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          
          {profileOpen && (
            <div style={{ position: "absolute", right: 0, top: 46, background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "8px", width: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 100 }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#0A1628", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</div>
                <div style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "Pro Exporter"}</div>
              </div>
              <button onClick={handleSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", color: "#EF4444", fontWeight: 600, fontSize: 13, cursor: "pointer", borderRadius: 8, fontFamily: "inherit" }}>
                <Icon name="logout" size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default TopBar;
