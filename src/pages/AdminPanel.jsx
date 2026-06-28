import React, { useState, useEffect, useRef } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import StatCard from "../components/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { MiniBarChart, DonutChart } from "../components/Charts.jsx";
import NotifItem from "../components/NotifItem.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import api from "../api.js";
const AdminPanel = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    insuranceRate: 0.015,
    baseDocCost: 25000,
    foodDocCostExtra: 12000,
    medicalDocCostExtra: 18000,
    defaultTariff: 0.06,
    resourceLinks: {},
    exportGuidancePhases: []
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' or 'edit'
  const [editFormData, setEditFormData] = useState({});
  const [savingUser, setSavingUser] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, adminUsers: 0, docsGenerated: 0, companiesRegistered: 0 });
  const [notification, setNotification] = useState(null);
  const [contentTab, setContentTab] = useState('links');
  const [expandedClauseIndex, setExpandedClauseIndex] = useState(null);
    const [selectedDocTypeForFields, setSelectedDocTypeForFields] = useState('Commercial Invoice');
  const [selectedDocTypeForClauses, setSelectedDocTypeForClauses] = useState('Commercial Invoice');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleSortClauses = () => {
    const dt = { ...(settings.documentTemplates || {}) };
    let docKey = 'commercialInvoice';
    if (selectedDocTypeForClauses === 'Proforma Invoice') docKey = 'proformaInvoice';
    if (selectedDocTypeForClauses === 'Packing List') docKey = 'packingList';
    if (selectedDocTypeForClauses === 'Export Contract') docKey = 'exportContract';
    
    if (!dt[docKey]) dt[docKey] = { clauses: [] };
    if (!dt[docKey].clauses) dt[docKey].clauses = [];
    
    const clauses = [...dt[docKey].clauses];
    const draggedItemContent = clauses.splice(dragItem.current, 1)[0];
    clauses.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    
    dt[docKey].clauses = clauses;
    setSettings({ ...settings, documentTemplates: dt });
  };

  const handleSortFields = () => {
    const dt = { ...(settings.documentCustomFields || {}) };
    if (!dt[selectedDocTypeForFields]) dt[selectedDocTypeForFields] = [];
    
    const fields = [...dt[selectedDocTypeForFields]];
    const draggedItemContent = fields.splice(dragItem.current, 1)[0];
    fields.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    
    dt[selectedDocTypeForFields] = fields;
    setSettings({ ...settings, documentCustomFields: dt });
  };


  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setModalType('view');
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditFormData({ name: user.name, company: user.company, role: user.status === 'Admin' ? 'admin' : 'user' });
    setModalType('edit');
  };

  const handleAdd = () => {
    setEditFormData({ name: '', email: '', password: '', company: '', role: 'user' });
    setModalType('add');
  };

  const closeModals = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const saveUserEdit = async () => {
    setSavingUser(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, editFormData);
      setUsers(users.map(u => u.id === selectedUser.id ? { 
        ...u, 
        name: editFormData.name, 
        company: editFormData.company, 
        status: editFormData.role === 'admin' ? 'Admin' : 'Active', 
        color: editFormData.role === 'admin' ? 'purple' : 'green',
        role: editFormData.role 
      } : u));
      showNotification('User updated successfully', 'success');
      closeModals();
    } catch (err) {
      console.error("Failed to save user", err);
      showNotification('Failed to update user', 'error');
    }
    setSavingUser(false);
  };

  const saveNewUser = async () => {
    setSavingUser(true);
    try {
      const res = await api.post(`/admin/users`, editFormData);
      setUsers([{
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        company: res.data.company || "N/A",
        status: res.data.role === 'admin' ? 'Admin' : 'Active',
        color: res.data.role === 'admin' ? 'purple' : 'green',
        role: res.data.role,
        phase: 'Phase 1: Setup',
        docs: 0
      }, ...users]);
      showNotification('User added successfully', 'success');
      closeModals();
    } catch (err) {
      console.error("Failed to add user", err);
      showNotification(err.response?.data?.error || 'Failed to add user', 'error');
    }
    setSavingUser(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, sRes, statsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/settings'),
          api.get('/admin/stats')
        ]);
        setUsers(uRes.data);
        if (sRes.data) setSettings(sRes.data);
        if (statsRes.data) setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      }
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/admin/settings', settings);
      showNotification('Settings updated successfully', 'success');
    } catch (err) {
      console.error("Failed to save settings", err);
      showNotification('Failed to save settings', 'error');
    }
    setSavingSettings(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Sidebar active="admin" onNavigate={onNavigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, overflow: "auto" }}>
        <TopBar title="Admin Panel" onNavigate={onNavigate} />
        <div style={{ padding: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard icon="user" label="Total Users" value={stats.totalUsers} sub="Registered users" trend="neutral" color="#1E6FD9" bg="#EFF6FF" />
            <StatCard icon="shield" label="Admin Users" value={stats.adminUsers} sub="Platform administrators" trend="neutral" color="#10B981" bg="#ECFDF5" />
            <StatCard icon="document" label="Documents Generated" value={stats.docsGenerated} sub="All time generated" trend="neutral" color="#8B5CF6" bg="#F5F3FF" />
          </div>

          <div className="grid-3-2" style={{ gap: 20, marginBottom: 20 }}>
            {/* User Management */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #F9FAFB" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: 0 }}>User Management</h3>
                <div style={{ display: "flex", flexWrap: "wrap", flex: 1, minWidth: "200px", gap: 10 }}>
                  <input placeholder="Search users..." style={{ flex: 1, minWidth: "120px", padding: "7px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={handleAdd} style={{ padding: "7px 14px", background: "#1E6FD9", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flex: "1 1 auto" }}>+ Add User</button>
                </div>
              </div>
              <div className="desktop-table" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["User", "Phase", "Docs", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.name} style={{ borderBottom: "1px solid #F9FAFB" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {user.profilePic ? (
                              <img src={user.profilePic.startsWith('http') ? user.profilePic : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.profilePic.startsWith('/') ? '' : '/'}${user.profilePic}`} alt={user.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E6FD9&color=fff`; }} referrerPolicy="no-referrer" />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E6FD9", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{user.name.split(" ").map(n => n[0]).join("")}</div>
                            )}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>{user.name}</div>
                              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{user.company}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, color: "#374151" }}>{user.phase}</span></td>
                        <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{user._count?.documents || user.docs || 0}</span></td>
                        <td style={{ padding: "12px 16px" }}><Badge color={user.color || "blue"}>{user.status}</Badge></td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => handleView(user)} style={{ padding: "4px 10px", border: "1px solid #E5E7EB", borderRadius: 6, background: "white", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>View</button>
                            <button onClick={() => handleEdit(user)} style={{ padding: "4px 10px", border: "1px solid #E5E7EB", borderRadius: 6, background: "white", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="mobile-cards" style={{ padding: "0 24px 24px" }}>
                {users.map(user => (
                  <div key={user.name} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, background: "#F8FAFC" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {user.profilePic ? (
<img src={user.profilePic.startsWith('http') ? user.profilePic : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.profilePic.startsWith('/') ? '' : '/'}${user.profilePic}`} alt={user.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E6FD9&color=fff`; }} referrerPolicy="no-referrer" />
) : (
<div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E6FD9", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{user.name.split(" ").map(n => n[0]).join("")}</div>
)}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: "#9CA3AF" }}>{user.company}</div>
                        </div>
                      </div>
                      <Badge color={user.color}>{user.status}</Badge>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 14 }}>
                      <div><span style={{ color: "#9CA3AF" }}>Phase:</span> {user.phase}</div>
                      <div><span style={{ color: "#9CA3AF" }}>Docs:</span> <span style={{ fontWeight: 600 }}>{user.docs}</span></div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleView(user)} style={{ flex: 1, padding: "8px", border: "1px solid #E5E7EB", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 600, color: "#0A1628", cursor: "pointer", fontFamily: "inherit" }}>View</button>
                      <button onClick={() => handleEdit(user)} style={{ flex: 1, padding: "8px", border: "1px solid #E5E7EB", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 600, color: "#0A1628", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Estimator Configurations */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #F9FAFB" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: 0 }}>Estimator Configurations</h3>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Live variables for the cost estimator</div>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Insurance Rate (Multiplier)</label>
                    <input type="number" step="0.001" value={settings.insuranceRate} onChange={(e) => setSettings({...settings, insuranceRate: parseFloat(e.target.value)})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Base Documentation Cost (PKR)</label>
                    <input type="number" value={settings.baseDocCost} onChange={(e) => setSettings({...settings, baseDocCost: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Food/Agri Extra Doc Cost (PKR)</label>
                    <input type="number" value={settings.foodDocCostExtra} onChange={(e) => setSettings({...settings, foodDocCostExtra: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Medical/Surgical Extra Doc Cost (PKR)</label>
                    <input type="number" value={settings.medicalDocCostExtra} onChange={(e) => setSettings({...settings, medicalDocCostExtra: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Default Customs Tariff (Multiplier)</label>
                    <input type="number" step="0.01" value={settings.defaultTariff} onChange={(e) => setSettings({...settings, defaultTariff: parseFloat(e.target.value)})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
                  </div>
                  <button onClick={handleSaveSettings} disabled={savingSettings} style={{ marginTop: 8, width: "100%", padding: "10px", background: "#1E6FD9", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: savingSettings ? "not-allowed" : "pointer", opacity: savingSettings ? 0.7 : 1 }}>
                    {savingSettings ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Management */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #F9FAFB", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: 0 }}>Content Management</h3>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Manage Resource Links and Export Guidance Roadmap</div>
              </div>
              <button onClick={handleSaveSettings} disabled={savingSettings} style={{ padding: "8px 16px", background: "#1E6FD9", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: savingSettings ? "not-allowed" : "pointer", opacity: savingSettings ? 0.7 : 1 }}>
                {savingSettings ? "Saving..." : "Save Content"}
              </button>
            </div>
            <div style={{ padding: "0 24px 20px" }}>
              <div style={{ display: "flex", gap: 16, borderBottom: "1px solid #F1F5F9", marginBottom: 20, overflowX: "auto", whiteSpace: "nowrap" }}>
                <button onClick={() => setContentTab('links')} style={{ background: "none", border: "none", padding: "16px 4px", borderBottom: contentTab === 'links' ? "2px solid #1E6FD9" : "2px solid transparent", color: contentTab === 'links' ? "#1E6FD9" : "#64748B", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Resource Links</button>
                <button onClick={() => setContentTab('phases')} style={{ background: "none", border: "none", padding: "16px 4px", borderBottom: contentTab === 'phases' ? "2px solid #1E6FD9" : "2px solid transparent", color: contentTab === 'phases' ? "#1E6FD9" : "#64748B", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Guidance Roadmap</button>
                <button onClick={() => setContentTab('announcements')} style={{ background: "none", border: "none", padding: "16px 4px", borderBottom: contentTab === 'announcements' ? "2px solid #1E6FD9" : "2px solid transparent", color: contentTab === 'announcements' ? "#1E6FD9" : "#64748B", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Announcements</button>
                <button onClick={() => setContentTab('templates')} style={{ background: "none", border: "none", padding: "16px 4px", borderBottom: contentTab === 'templates' ? "2px solid #1E6FD9" : "2px solid transparent", color: contentTab === 'templates' ? "#1E6FD9" : "#64748B", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Document Templates</button>
                <button onClick={() => setContentTab('custom_fields')} style={{ background: "none", border: "none", padding: "16px 4px", borderBottom: contentTab === 'custom_fields' ? "2px solid #1E6FD9" : "2px solid transparent", color: contentTab === 'custom_fields' ? "#1E6FD9" : "#64748B", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Custom Fields</button>
                <button onClick={() => setContentTab('theme_layout')} style={{ background: "none", border: "none", padding: "16px 4px", borderBottom: contentTab === 'theme_layout' ? "2px solid #1E6FD9" : "2px solid transparent", color: contentTab === 'theme_layout' ? "#1E6FD9" : "#64748B", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Theme & Layout</button>
              </div>

              {contentTab === 'links' && (
                <div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {Object.entries(settings.resourceLinks || {}).map(([key, value], idx) => (
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <input 
                          type="text" 
                          value={key} 
                          onChange={(e) => {
                            const newLinks = { ...settings.resourceLinks };
                            const oldVal = newLinks[key];
                            delete newLinks[key];
                            newLinks[e.target.value] = oldVal;
                            setSettings({ ...settings, resourceLinks: newLinks });
                          }}
                          placeholder="Document/Resource Name" 
                          style={{ flex: "1 1 200px", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} 
                        />
                        <input 
                          type="text" 
                          value={value} 
                          onChange={(e) => {
                            const newLinks = { ...settings.resourceLinks };
                            newLinks[key] = e.target.value;
                            setSettings({ ...settings, resourceLinks: newLinks });
                          }}
                          placeholder="URL" 
                          style={{ flex: "2 1 200px", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} 
                        />
                        <button 
                          onClick={() => {
                            const newLinks = { ...settings.resourceLinks };
                            delete newLinks[key];
                            setSettings({ ...settings, resourceLinks: newLinks });
                          }}
                          style={{ padding: "8px 12px", background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >Remove</button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newLinks = { ...settings.resourceLinks, ["New Resource " + Date.now()]: "https://" };
                        setSettings({ ...settings, resourceLinks: newLinks });
                      }}
                      style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "1px dashed #CBD5E1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}
                    >+ Add New Resource Link</button>
                  </div>
                </div>
              )}

              {contentTab === 'phases' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ marginBottom: 4, fontSize: 13, color: "#64748B" }}>
                    Manage Export Guidance phases and steps visually.
                  </div>
                  <div style={{ maxHeight: "500px", overflowY: "auto", paddingRight: 8, display: "flex", flexDirection: "column", gap: 20 }}>
                    {(settings.exportGuidancePhases || []).map((phase, pIdx) => (
                      <div key={pIdx} style={{ padding: 16, border: "1px solid #E2E8F0", borderRadius: 12, background: "#F8FAFC" }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                        <input 
                          value={phase.num || ''} 
                          onChange={(e) => {
                            const newPhases = [...settings.exportGuidancePhases];
                            newPhases[pIdx].num = e.target.value;
                            setSettings({ ...settings, exportGuidancePhases: newPhases });
                          }} 
                          placeholder="Phase No."
                          style={{ flex: "1 1 80px", minWidth: 80, padding: "8px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13 }}
                        />
                        <input 
                          value={phase.title || ''} 
                          onChange={(e) => {
                            const newPhases = [...settings.exportGuidancePhases];
                            newPhases[pIdx].title = e.target.value;
                            setSettings({ ...settings, exportGuidancePhases: newPhases });
                          }} 
                          placeholder="Phase Title"
                          style={{ flex: "3 1 200px", padding: "8px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13 }}
                        />
                        <input 
                          value={phase.color || ''} 
                          onChange={(e) => {
                            const newPhases = [...settings.exportGuidancePhases];
                            newPhases[pIdx].color = e.target.value;
                            setSettings({ ...settings, exportGuidancePhases: newPhases });
                          }} 
                          placeholder="Hex Color (e.g. #10B981)"
                          style={{ flex: "1 1 140px", minWidth: 140, padding: "8px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13 }}
                        />
                        <button 
                          onClick={() => {
                            const newPhases = [...settings.exportGuidancePhases];
                            newPhases.splice(pIdx, 1);
                            setSettings({ ...settings, exportGuidancePhases: newPhases });
                          }}
                          style={{ padding: "8px 12px", background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                        >Remove Phase</button>
                      </div>
                      
                      <div style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                        {(phase.steps || []).map((step, sIdx) => (
                          <div key={sIdx} style={{ padding: 12, background: "white", border: "1px solid #E5E7EB", borderRadius: 8 }}>
                            <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                              <input 
                                value={step.title || ''} 
                                onChange={(e) => {
                                  const newPhases = [...settings.exportGuidancePhases];
                                  newPhases[pIdx].steps[sIdx].title = e.target.value;
                                  setSettings({ ...settings, exportGuidancePhases: newPhases });
                                }} 
                                placeholder="Step Title"
                                style={{ flex: "1 1 150px", padding: "6px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13 }}
                              />
                              <button 
                                onClick={() => {
                                  const newPhases = [...settings.exportGuidancePhases];
                                  newPhases[pIdx].steps.splice(sIdx, 1);
                                  setSettings({ ...settings, exportGuidancePhases: newPhases });
                                }}
                                style={{ padding: "6px 10px", background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}
                              >Remove Step</button>
                            </div>
                            <textarea 
                              value={step.desc || ''} 
                              onChange={(e) => {
                                const newPhases = [...settings.exportGuidancePhases];
                                newPhases[pIdx].steps[sIdx].desc = e.target.value;
                                setSettings({ ...settings, exportGuidancePhases: newPhases });
                              }} 
                              placeholder="Step Description"
                              style={{ width: "100%", padding: "6px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 12, marginBottom: 8, resize: "vertical", minHeight: "50px", fontFamily: "inherit" }}
                            />
                            <input 
                              value={(step.docs || []).join(", ")} 
                              onChange={(e) => {
                                const newPhases = [...settings.exportGuidancePhases];
                                newPhases[pIdx].steps[sIdx].docs = e.target.value.split(",").map(d => d.trim()).filter(Boolean);
                                setSettings({ ...settings, exportGuidancePhases: newPhases });
                              }} 
                              placeholder="Required Documents (comma separated, e.g. NTN Application, SECP Guide)"
                              style={{ width: "100%", padding: "6px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 12 }}
                            />
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newPhases = [...settings.exportGuidancePhases];
                            if (!newPhases[pIdx].steps) newPhases[pIdx].steps = [];
                            newPhases[pIdx].steps.push({ title: "New Step", desc: "", docs: [], done: false });
                            setSettings({ ...settings, exportGuidancePhases: newPhases });
                          }}
                          style={{ padding: "6px 12px", background: "white", color: "#475569", border: "1px dashed #CBD5E1", borderRadius: 6, fontSize: 12, cursor: "pointer", alignSelf: "flex-start" }}
                        >+ Add Step</button>
                      </div>
                    </div>
                  ))}
                  </div>
                  <button 
                    onClick={() => {
                      const newPhases = [...(settings.exportGuidancePhases || [])];
                      newPhases.push({ num: "00", title: "New Phase", color: "#1E6FD9", bg: "#EFF6FF", steps: [] });
                      setSettings({ ...settings, exportGuidancePhases: newPhases });
                    }}
                    style={{ padding: "10px 16px", background: "#F1F5F9", color: "#475569", border: "1px dashed #CBD5E1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >+ Add New Phase</button>
                </div>
              )}

              {contentTab === 'announcements' && (
                <div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {(settings.announcements || []).map((ann, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <select 
                          value={ann.type} 
                          onChange={(e) => {
                            const newAnn = [...(settings.announcements || [])];
                            newAnn[idx].type = e.target.value;
                            setSettings({ ...settings, announcements: newAnn });
                          }}
                          style={{ flex: "1 1 120px", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white" }} 
                        >
                          <option value="info">Info (Blue)</option>
                          <option value="warning">Warning (Yellow)</option>
                          <option value="success">Success (Green)</option>
                          <option value="error">Error (Red)</option>
                        </select>
                        <input 
                          type="text" 
                          value={ann.message} 
                          onChange={(e) => {
                            const newAnn = [...(settings.announcements || [])];
                            newAnn[idx].message = e.target.value;
                            setSettings({ ...settings, announcements: newAnn });
                          }}
                          placeholder="Announcement message..." 
                          style={{ flex: "3 1 200px", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} 
                        />
                        <button 
                          onClick={() => {
                            const newAnn = [...(settings.announcements || [])];
                            newAnn.splice(idx, 1);
                            setSettings({ ...settings, announcements: newAnn });
                          }}
                          style={{ padding: "8px 12px", background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >Remove</button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newAnn = [...(settings.announcements || []), { type: 'info', message: '' }];
                        setSettings({ ...settings, announcements: newAnn });
                      }}
                      style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "1px dashed #CBD5E1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8, alignSelf: "flex-start" }}
                    >+ Add Announcement</button>
                  </div>
                </div>
              )}

              {contentTab === 'templates' && (() => {
                let docKey = 'commercialInvoice';
                if (selectedDocTypeForClauses === 'Proforma Invoice') docKey = 'proformaInvoice';
                if (selectedDocTypeForClauses === 'Packing List') docKey = 'packingList';
                if (selectedDocTypeForClauses === 'Export Contract') docKey = 'exportContract';
                
                const clausesList = settings.documentTemplates?.[docKey]?.clauses || [];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                      <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Select Document Type:</label>
                      <select 
                        value={selectedDocTypeForClauses} 
                        onChange={(e) => setSelectedDocTypeForClauses(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", background: "white", flex: "1 1 200px" }}
                      >
                        <option value="Commercial Invoice">Commercial Invoice</option>
                        <option value="Packing List">Packing List</option>
                        <option value="Export Contract">Export Contract</option>
                        <option value="Proforma Invoice">Proforma Invoice</option>
                      </select>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", margin: 0 }}>{selectedDocTypeForClauses} Clauses / Terms</h4>
                        <button 
                          onClick={() => {
                            const dt = { ...(settings.documentTemplates || {}) };
                            if (!dt[docKey]) dt[docKey] = { clauses: [] };
                            if (!dt[docKey].clauses) dt[docKey].clauses = [];
                            dt[docKey].clauses.push({ title: "New Clause", text: "" });
                            setSettings({ ...settings, documentTemplates: dt });
                          }}
                          style={{ padding: "6px 12px", background: "white", color: "#1E6FD9", border: "1px solid #1E6FD9", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >+ Add Clause / Term</button>
                      </div>
                      
                      <div style={{ background: "#EFF6FF", color: "#1E6FD9", padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <Icon name="document" size={18} />
                          Tip: Use variables like {'{buyerName}'}, {'{description}'}, {'{contractValue}'}, {'{incoterms}'}, {'{deliveryDate}'}, {'{governingLaw}'} in your text. Drag and drop items to reorder them.
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {clausesList.map((clause, idx) => {
                          const isExpanded = expandedClauseIndex === idx;
                          return (
                            <div 
                              key={idx} 
                              draggable 
                              onDragStart={(e) => (dragItem.current = idx)} 
                              onDragEnter={(e) => (dragOverItem.current = idx)} 
                              onDragEnd={handleSortClauses} 
                              onDragOver={(e) => e.preventDefault()}
                              style={{ background: "white", padding: 16, borderRadius: 8, border: "1px solid #E5E7EB", cursor: "grab" }}
                            >
                              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                                <div style={{ cursor: "grab", color: "#CBD5E1", display: "flex", alignItems: "center" }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                </div>
                                <div style={{ width: 30, height: 30, background: "#F1F5F9", borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#475569", flexShrink: 0 }}>
                                  {idx + 1}
                                </div>
                                <div style={{ flex: "1 1 200px", fontSize: 14, fontWeight: 600, color: "#0A1628" }}>
                                  {clause.title || "Untitled Clause"}
                                </div>
                                <button 
                                  onClick={() => setExpandedClauseIndex(isExpanded ? null : idx)}
                                  style={{ padding: "6px 12px", background: "white", color: "#1E6FD9", border: "1px solid #1E6FD9", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                >{isExpanded ? "Close" : "Edit"}</button>
                              </div>
                              
                              {isExpanded && (
                                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, borderTop: "1px dashed #E2E8F0", paddingTop: 16 }}>
                                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    <input 
                                      value={clause.title}
                                      onChange={(e) => {
                                        const dt = { ...(settings.documentTemplates || {}) };
                                        dt[docKey].clauses[idx].title = e.target.value;
                                        setSettings({ ...settings, documentTemplates: dt });
                                      }}
                                      placeholder="Clause Title"
                                      style={{ flex: "1 1 200px", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                                    />
                                    <button 
                                      onClick={() => {
                                        const dt = { ...(settings.documentTemplates || {}) };
                                        dt[docKey].clauses.splice(idx, 1);
                                        setSettings({ ...settings, documentTemplates: dt });
                                      }}
                                      style={{ padding: "8px 12px", background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                    >Remove</button>
                                  </div>
                                  <textarea 
                                    value={clause.text}
                                    onChange={(e) => {
                                      const dt = { ...(settings.documentTemplates || {}) };
                                      dt[docKey].clauses[idx].text = e.target.value;
                                      setSettings({ ...settings, documentTemplates: dt });
                                    }}
                                    placeholder="Clause body text..."
                                    style={{ width: "100%", padding: "12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, minHeight: 80, fontFamily: "inherit" }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {contentTab === 'custom_fields' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Select Document Type:</label>
                    <select 
                      value={selectedDocTypeForFields} 
                      onChange={(e) => setSelectedDocTypeForFields(e.target.value)}
                      style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", background: "white", flex: "1 1 200px" }}
                    >
                      <option value="Commercial Invoice">Commercial Invoice</option>
                      <option value="Packing List">Packing List</option>
                      <option value="Export Contract">Export Contract</option>
                      <option value="Proforma Invoice">Proforma Invoice</option>
                    </select>
                  </div>
                  
                  <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", margin: 0 }}>Fields for {selectedDocTypeForFields}</h4>
                      <button 
                        onClick={() => {
                          const dt = { ...(settings.documentCustomFields || {}) };
                          if (!dt[selectedDocTypeForFields]) dt[selectedDocTypeForFields] = [];
                          dt[selectedDocTypeForFields].push({ name: `field_${Date.now()}`, label: "New Field", type: "text" });
                          setSettings({ ...settings, documentCustomFields: dt });
                        }}
                        style={{ padding: "6px 12px", background: "white", color: "#1E6FD9", border: "1px solid #1E6FD9", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >+ Add Custom Field</button>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {((settings.documentCustomFields || {})[selectedDocTypeForFields] || []).length === 0 && (
                        <div style={{ fontSize: 13, color: "#9CA3AF" }}>No custom fields added yet.</div>
                      )}
                      {((settings.documentCustomFields || {})[selectedDocTypeForFields] || []).map((field, idx) => (
                        <div 
                          key={idx} 
                          draggable 
                          onDragStart={(e) => (dragItem.current = idx)} 
                          onDragEnter={(e) => (dragOverItem.current = idx)} 
                          onDragEnd={handleSortFields} 
                          onDragOver={(e) => e.preventDefault()}
                          style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", background: "white", padding: 12, borderRadius: 8, border: "1px solid #E5E7EB", cursor: "grab" }}
                        >
                          <div style={{ cursor: "grab", color: "#CBD5E1", display: "flex", alignItems: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 150px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4 }}>Label (Display Name)</span>
                            <input 
                              type="text" 
                              value={field.label} 
                              onChange={(e) => {
                                const dt = { ...(settings.documentCustomFields || {}) };
                                dt[selectedDocTypeForFields][idx].label = e.target.value;
                                setSettings({ ...settings, documentCustomFields: dt });
                              }}
                              style={{ padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13 }}
                            />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 150px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4 }}>Variable Name</span>
                            <input 
                              type="text" 
                              value={field.name} 
                              onChange={(e) => {
                                const dt = { ...(settings.documentCustomFields || {}) };
                                dt[selectedDocTypeForFields][idx].name = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                setSettings({ ...settings, documentCustomFields: dt });
                              }}
                              style={{ padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13 }}
                            />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 120px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4 }}>Input Type</span>
                            <select 
                              value={field.type} 
                              onChange={(e) => {
                                const dt = { ...(settings.documentCustomFields || {}) };
                                dt[selectedDocTypeForFields][idx].type = e.target.value;
                                setSettings({ ...settings, documentCustomFields: dt });
                              }}
                              style={{ padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, background: "white" }}
                            >
                              <option value="text">Short Text</option>
                              <option value="textarea">Long Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                            </select>
                          </div>
                          <button 
                            onClick={() => {
                              const dt = { ...(settings.documentCustomFields || {}) };
                              dt[selectedDocTypeForFields].splice(idx, 1);
                              setSettings({ ...settings, documentCustomFields: dt });
                            }}
                            style={{ padding: "6px 10px", background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-end", marginBottom: 2 }}
                          >Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {contentTab === 'theme_layout' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Select Document Type:</label>
                    <select 
                      value={selectedDocTypeForFields} 
                      onChange={(e) => setSelectedDocTypeForFields(e.target.value)}
                      style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", background: "white", flex: "1 1 200px" }}
                    >
                      <option value="Commercial Invoice">Commercial Invoice</option>
                      <option value="Packing List">Packing List</option>
                      <option value="Export Contract">Export Contract</option>
                      <option value="Proforma Invoice">Proforma Invoice</option>
                    </select>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0", display: "grid", gap: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", margin: 0 }}>Theme Settings for {selectedDocTypeForFields}</h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Primary Color</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input 
                            type="color" 
                            value={settings.documentThemes?.[selectedDocTypeForFields]?.primaryColor || "#1A2942"}
                            onChange={(e) => {
                              const dt = { ...(settings.documentThemes || {}) };
                              if (!dt[selectedDocTypeForFields]) dt[selectedDocTypeForFields] = { layoutPattern: "modern" };
                              dt[selectedDocTypeForFields].primaryColor = e.target.value;
                              setSettings({ ...settings, documentThemes: dt });
                            }}
                            style={{ width: 40, height: 40, padding: 0, border: "none", borderRadius: 8, cursor: "pointer", flexShrink: 0 }}
                          />
                          <input 
                            type="text" 
                            value={settings.documentThemes?.[selectedDocTypeForFields]?.primaryColor || "#1A2942"}
                            onChange={(e) => {
                              const dt = { ...(settings.documentThemes || {}) };
                              if (!dt[selectedDocTypeForFields]) dt[selectedDocTypeForFields] = { layoutPattern: "modern" };
                              dt[selectedDocTypeForFields].primaryColor = e.target.value;
                              setSettings({ ...settings, documentThemes: dt });
                            }}
                            style={{ flex: 1, padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white", height: 40, boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Layout Pattern</label>
                        <select 
                          value={settings.documentThemes?.[selectedDocTypeForFields]?.layoutPattern || "modern"}
                          onChange={(e) => {
                            const dt = { ...(settings.documentThemes || {}) };
                            if (!dt[selectedDocTypeForFields]) dt[selectedDocTypeForFields] = { primaryColor: "#1A2942" };
                            dt[selectedDocTypeForFields].layoutPattern = e.target.value;
                            setSettings({ ...settings, documentThemes: dt });
                          }}
                          style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", background: "white", height: 40, boxSizing: "border-box" }}
                        >
                          <option value="modern">Modern (Boxed Grid)</option>
                          <option value="classic">Classic (Traditional Table)</option>
                          <option value="minimal">Minimal (Clean Lines)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>
      </div>
      
      {/* Modals */}
      {modalType && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,22,40,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 450, overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0A1628" }}>
                {modalType === 'view' ? 'User Details' : modalType === 'add' ? 'Add New User' : 'Edit User'}
              </h3>
              <button onClick={closeModals} style={{ background: "transparent", border: "none", fontSize: 20, color: "#9CA3AF", cursor: "pointer", padding: 0 }}>&times;</button>
            </div>
            <div style={{ padding: "24px" }}>
              {modalType === 'view' && selectedUser && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                    {selectedUser.profilePic ? (
                      <img src={selectedUser.profilePic.startsWith('http') ? selectedUser.profilePic : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${selectedUser.profilePic.startsWith('/') ? '' : '/'}${selectedUser.profilePic}`} alt={selectedUser.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=1E6FD9&color=fff`; }} referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1E6FD9", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                        {selectedUser.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#0A1628" }}>{selectedUser.name}</div>
                      <div style={{ fontSize: 13, color: "#64748B" }}>{selectedUser.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, background: "#F8FAFC", padding: 16, borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Company</div>
                      <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 500 }}>{selectedUser.company || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Status</div>
                      <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 500 }}><Badge color={selectedUser.color}>{selectedUser.status}</Badge></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Phase</div>
                      <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 500 }}>{selectedUser.phase}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Documents</div>
                      <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 500 }}>{selectedUser.docs || 0}</div>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>User Role</div>
                      <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 500 }}>{selectedUser.role || 'user'}</div>
                    </div>
                  </div>
                </div>
              )}
              {(modalType === 'edit' || modalType === 'add') && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full Name</label>
                    <input value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                  </div>
                  {modalType === 'add' && (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
                        <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
                        <input type="password" value={editFormData.password} onChange={(e) => setEditFormData({...editFormData, password: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                      </div>
                    </>
                  )}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Company</label>
                    <input value={editFormData.company} onChange={(e) => setEditFormData({...editFormData, company: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Role</label>
                    <select value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", backgroundColor: "white" }}>
                      <option value="user">Standard User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            {(modalType === 'edit' || modalType === 'add') && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button onClick={closeModals} style={{ padding: "8px 16px", border: "1px solid #E5E7EB", borderRadius: 8, background: "white", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={modalType === 'add' ? saveNewUser : saveUserEdit} disabled={savingUser} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: "#1E6FD9", fontSize: 13, fontWeight: 600, color: "white", cursor: savingUser ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: savingUser ? 0.7 : 1 }}>
                  {savingUser ? 'Saving...' : modalType === 'add' ? 'Add User' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, padding: "12px 20px", borderRadius: 8,
          background: notification.type === 'success' ? '#10B981' : '#EF4444',
          color: "white", fontSize: 14, fontWeight: 600, zIndex: 9999,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
