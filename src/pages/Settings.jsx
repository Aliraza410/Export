import React, { useState, useEffect, useRef } from "react";
import Icon from "../components/Icon.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import api from "../api.js";

const Settings = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : { name: "", email: "", profilePic: null };
  });
  const [nameInput, setNameInput] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved).name || "" : "";
  });
  const [previewPic, setPreviewPic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setNameInput(res.data.user.name);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
      } catch (err) {
        console.error("Failed to fetch user", err);
        showToast("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append("name", nameInput);
      
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        formData.append("profilePic", fileInputRef.current.files[0]);
      }

      const res = await api.put('/user/profile', formData);
      
      setUser(res.data);
      localStorage.setItem('userData', JSON.stringify(res.data));
      showToast("Profile updated successfully!");
      setPreviewPic(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Force reload to update TopBar and Sidebar immediately
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error("Profile update error", err);
      showToast("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      showToast("Preparing data export...");
      const res = await api.get('/user/export-data');
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", `exportease_data_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      showToast("Data exported successfully!");
    } catch (err) {
      console.error("Export error", err);
      showToast("Failed to export data.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/user/account');
      localStorage.removeItem("token");
      onNavigate("login");
    } catch (err) {
      console.error("Delete account error", err);
      showToast("Failed to delete account.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Sidebar active="settings" onNavigate={onNavigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}>
        <TopBar title="Settings" onNavigate={onNavigate} />
        <div className="dashboard-content" style={{ padding: "28px", maxWidth: 800 }}>
          
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0A1628", margin: "0 0 8px" }}>Account Settings</h2>
            <p style={{ fontSize: 15, color: "#64748B", margin: 0 }}>Manage your profile, data, and account preferences.</p>
          </div>

          {loading ? (
            <div style={{ fontSize: 14, color: "#9CA3AF" }}>Loading profile...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Profile Settings */}
              <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0A1628", margin: "0 0 20px" }}>Profile Information</h3>
                
                <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ 
                      width: 80, height: 80, borderRadius: "50%", background: "#EFF6FF", 
                      border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", position: "relative"
                    }}>
                      {previewPic ? (
                        <img src={previewPic} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : user.profilePic ? (
                        <img src={user.profilePic.startsWith('http') ? user.profilePic : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.profilePic.startsWith('/') ? '' : '/'}${user.profilePic}`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                      ) : (
                        <Icon name="user" size={32} color="#94A3B8" />
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setPreviewPic(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <button type="button" onClick={() => fileInputRef.current.click()} style={{ padding: "8px 16px", background: "white", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
                        Change Avatar
                      </button>
                      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>JPG, PNG up to 2MB</div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Full Name</label>
                    <input 
                      type="text" 
                      value={nameInput} 
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => e.target.style.borderColor = "#1E6FD9"}
                      onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Email Address (Read-only)</label>
                    <input 
                      type="email" 
                      value={user.email} 
                      disabled
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#F8FAFC", color: "#94A3B8", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button type="submit" disabled={saving} style={{ padding: "12px 24px", background: "#1E6FD9", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "opacity 0.2s" }}>
                      {saving ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Data Management */}
              <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0A1628", margin: "0 0 8px" }}>Export Data</h3>
                <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>Download a complete copy of all your documents, estimates, and progress history in JSON format.</p>
                <button onClick={handleExportData} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "white", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon name="download" size={16} /> Export as JSON
                </button>
              </div>

              {/* Danger Zone */}
              <div style={{ background: "#FEF2F2", borderRadius: 16, padding: 28, border: "1px solid #FECACA" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#991B1B", margin: "0 0 8px" }}>Danger Zone</h3>
                <p style={{ fontSize: 14, color: "#B91C1C", margin: "0 0 20px" }}>Once you delete your account, there is no going back. All your documents and data will be permanently wiped.</p>
                
                {showDeleteConfirm ? (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button onClick={handleDeleteAccount} disabled={deleting} style={{ padding: "10px 20px", background: "#DC2626", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                      {deleting ? "Deleting..." : "Yes, permanently delete"}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} style={{ padding: "10px 20px", background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: "10px 20px", background: "#EF4444", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                    Delete Account
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#0A1628", color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)", zIndex: 1000, animation: "fadeIn 0.3s ease" }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default Settings;
