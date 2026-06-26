import React, { useState, useEffect } from "react";
import Icon from "./Icon.jsx";
import api from "../api.js";

const Sidebar = ({ active, onNavigate, collapsed, setCollapsed }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial check is handled by useState initialization, but let's sync collapse state
    if (window.innerWidth < 768 && setCollapsed) {
      setCollapsed(true);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollapsed]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
      } catch (err) {
        console.error("Failed to fetch user details for sidebar", err);
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
  const userNavItems = [
    { id: "dashboard", icon: "home", label: "Dashboard" },
    { id: "guidance", icon: "clipboard", label: "Export Guidance" },
    { id: "estimator", icon: "currency", label: "Cost Estimator" },
    { id: "documents", icon: "document", label: "Documents" },
    { id: "insights", icon: "trending", label: "Country Insights" },
    { id: "settings", icon: "settings", label: "Settings" },
  ];

  const adminNavItems = [
    { id: "admin", icon: "settings", label: "Admin Panel" }
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;
  const visibleNavItems = navItems.filter(item => !(isMobile && item.id === "settings"));

  const mobileSidebarStyle = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    width: "100%",
    background: "#0A1628",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 100,
    borderTop: "1px solid rgba(255,255,255,0.1)",
  };

  const desktopSidebarStyle = {
    width: collapsed ? 64 : 260,
    minHeight: "100vh",
    background: "#0A1628",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    transition: "width 0.3s ease",
    overflow: "hidden",
    zIndex: 100,
    position: "relative",
  };

  return (
    <>
      {isMobile && <style>{`body { padding-bottom: 70px; }`}</style>}
      <div className="app-sidebar" style={isMobile ? mobileSidebarStyle : desktopSidebarStyle}>
        
        {!isMobile && (
          <div className="app-sidebar-header" style={{ padding: collapsed ? "20px 14px" : "20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
            {!collapsed && (
              <div onClick={() => onNavigate("landing")} style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "white", whiteSpace: "nowrap" }}>Export Ease</div>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 500 }}>Pakistan</div>
              </div>
            )}
            <button className="app-sidebar-toggle" onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 4 }}>
              <Icon name="menu" size={20} />
            </button>
          </div>
        )}

        <nav className="app-sidebar-nav" style={{ 
          flex: 1, 
          padding: isMobile ? "0" : "16px 0", 
          display: "flex", 
          flexDirection: isMobile ? "row" : "column",
          justifyContent: isMobile ? "space-around" : "flex-start",
          alignItems: isMobile ? "center" : "stretch",
          width: "100%"
        }}>
          {visibleNavItems.map(item => (
            <button 
              className="app-sidebar-item" 
              key={item.id} 
              onClick={() => onNavigate(item.id)} 
              style={{ 
                width: isMobile ? "auto" : "100%", 
                display: "flex", 
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center", 
                justifyContent: isMobile ? "center" : "flex-start",
                gap: isMobile ? 4 : 12, 
                padding: isMobile ? "10px 0" : (collapsed ? "10px 18px" : "10px 20px"), 
                background: isMobile ? "none" : (active === item.id ? "rgba(30,111,217,0.15)" : "none"), 
                border: "none", 
                borderLeft: isMobile ? "none" : (active === item.id ? "2px solid #1E6FD9" : "2px solid transparent"), 
                borderTop: isMobile && active === item.id ? "2px solid #1E6FD9" : "2px solid transparent",
                color: active === item.id ? "#60A5FA" : "#475569", 
                cursor: "pointer", 
                textAlign: "center", 
                fontFamily: "inherit",
                flex: isMobile ? 1 : "none"
              }}
            >
              <Icon name={item.icon} size={isMobile ? 22 : 18} />
              {(!isMobile && !collapsed) && (
                <span className="app-sidebar-text" style={{ fontSize: 13, fontWeight: active === item.id ? 600 : 400 }}>{item.label}</span>
              )}
              {isMobile && (
                <span style={{ fontSize: 10, fontWeight: active === item.id ? 600 : 400, marginTop: 2 }}>{item.label.split(' ')[0]}</span>
              )}
            </button>
          ))}
        </nav>

        {!isMobile && (
          <div className="app-sidebar-footer" style={{ padding: collapsed ? "16px 14px" : "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {!collapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E6FD9", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12, flexShrink: 0, overflow: "hidden" }}>
                  {user?.profilePic ? (
                    <img src={user.profilePic.startsWith('http') ? user.profilePic : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.profilePic.startsWith('/') ? '' : '/'}${user.profilePic}`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                  ) : (
                    getInitials(user?.name)
                  )}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</div>
                  <div style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "Pro Exporter"}</div>
                </div>
              </div>
            )}
            <button onClick={handleSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4, justifyContent: collapsed ? "center" : "flex-start", fontFamily: "inherit" }}>
              <Icon name="logout" size={16} />
              {!collapsed && <span style={{ fontSize: 12 }}>Sign Out</span>}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
export default Sidebar;
