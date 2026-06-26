import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import StatCard from "../components/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { MiniBarChart, DonutChart } from "../components/Charts.jsx";
import NotifItem from "../components/NotifItem.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import api from "../api.js";
const Documents = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const [showGenModal, setShowGenModal] = useState(false);
  const [genDocType, setGenDocType] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genFormData, setGenFormData] = useState({
    buyerName: "", buyerAddress: "", portOfLoading: "", portOfDischarge: "",
    hsCode: "", description: "", quantity: 1, unitPrice: 0, paymentTerms: "",
    packageType: "Cartons", totalPackages: 1, dimensions: "", netWeight: 0, grossWeight: 0, shippingMark: "",
    contractValue: 0, incoterms: "FOB", deliveryDate: "", governingLaw: "Laws of Pakistan"
  });

  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    if (e.target.closest('.modal-drag-handle') && !e.target.closest('button')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPos.x,
        y: e.clientY - modalPos.y
      });
      e.preventDefault();
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setModalPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragStart]);

  const docTemplates = [
    { title: "Commercial Invoice", desc: "Full commercial invoice with buyer/seller info, HS codes, and payment terms.", icon: "document", color: "#1E6FD9", bg: "#EFF6FF" },
    { title: "Packing List", desc: "Detailed packing list with dimensions, weights, and package markings.", icon: "package", color: "#10B981", bg: "#ECFDF5" },
    { title: "Export Contract", desc: "Legally binding export contract with all trade terms and conditions.", icon: "clipboard", color: "#8B5CF6", bg: "#F5F3FF" },
    { title: "Proforma Invoice", desc: "Pre-shipment invoice for buyer confirmation and LC opening.", icon: "document", color: "#F59E0B", bg: "#FFFBEB" },
  ];

  const registrationTemplates = [
    {
      type: "NTN/STRN Application",
      desc: "Step-by-step FBR registration guidance",
      steps: [
        { id: "s1", label: "Create FBR IRIS Account", type: "link", url: "https://iris.fbr.gov.pk/", help: "Click to open the official Federal Board of Revenue portal and create an account." },
        { id: "s2", label: "Submit Business Details", type: "checkbox", help: "Fill in your property, business, and bank details in IRIS." },
        { id: "s3", label: "Receive NTN Certificate", type: "upload", help: "Upload your final NTN certificate PDF for verification." }
      ]
    },
    {
      type: "PSW Activation",
      desc: "Pakistan Single Window portal setup",
      steps: [
        { id: "s1", label: "Generate PSW Subscription Voucher", type: "link", url: "https://psw.gov.pk/", help: "Register on the PSW portal to generate your RS 500 voucher." },
        { id: "s2", label: "Complete Biometric Verification at NADRA", type: "checkbox", help: "Visit any NADRA e-Sahulat franchise with your CNIC and voucher." },
        { id: "s3", label: "Activate Profile on PSW Portal", type: "upload", help: "Upload a screenshot of your activated PSW profile dashboard." }
      ]
    },
    {
      type: "Form-E Approval",
      desc: "State Bank foreign exchange form",
      steps: [
        { id: "s1", label: "Submit Commercial Invoice to Bank", type: "checkbox", help: "Submit the invoice generated from ExportEase to your bank." },
        { id: "s2", label: "Bank Authorizes Form-E", type: "upload", help: "Upload the authorized Form-E document provided by your bank." }
      ]
    },
    {
      type: "Goods Declaration",
      desc: "Customs GD filing through PSW",
      steps: [
        { id: "s1", label: "Input Consignment Details in PSW", type: "link", url: "https://psw.gov.pk/", help: "Fill out the Goods Declaration (GD) form on the PSW portal." },
        { id: "s2", label: "Attach Form-E to GD", type: "checkbox", help: "Link your approved Form-E to the Goods Declaration." },
        { id: "s3", label: "Submit to Customs", type: "upload", help: "Upload the final submitted GD receipt." }
      ]
    }
  ];

  const [myDocs, setMyDocs] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [selectedReg, setSelectedReg] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [docToDelete, setDocToDelete] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    const fetchDocs = async () => {
      if (activeTab === "my-docs") {
        try {
          const res = await api.get('/documents');
          setMyDocs(res.data);
        } catch (err) {
          console.error("Failed to fetch documents", err);
        }
      } else if (activeTab === "registrations") {
        try {
          const res = await api.get('/registrations');
          const progressMap = {};
          res.data.forEach(r => progressMap[r.type] = { status: r.status, steps: r.steps });
          setUserProgress(progressMap);
        } catch (err) {
          console.error("Failed to fetch registrations", err);
        }
      }
    };
    fetchDocs();
  }, [activeTab]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMyDocs(prev => [res.data, ...prev]);
      setActiveTab("my-docs");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleOpenGenModal = (type) => {
    setGenDocType(type);
    setGenFormData({
      buyerName: "", buyerAddress: "", portOfLoading: "", portOfDischarge: "",
      hsCode: "", description: "", quantity: 1, unitPrice: 0, paymentTerms: "",
      totalPackages: 1, netWeight: 0, grossWeight: 0,
      contractValue: 0, incoterms: "FOB", deliveryDate: "", governingLaw: "Laws of Pakistan"
    });
    setModalPos({ x: 0, y: 0 });
    setShowGenModal(true);
  };

  const handleToggleStep = async (regType, stepId) => {
    const currentProgress = userProgress[regType] || { steps: {}, status: "Not Started" };
    const stepData = currentProgress.steps[stepId];
    const isCurrentlyCompleted = stepData === true || stepData?.completed === true;
    const newSteps = { ...currentProgress.steps, [stepId]: !isCurrentlyCompleted };

    const template = registrationTemplates.find(t => t.type === regType);
    const completedCount = template.steps.filter(s => {
      const st = newSteps[s.id];
      return st === true || st?.completed === true;
    }).length;

    let newStatus = "Not Started";
    if (completedCount === template.steps.length) newStatus = "Complete";
    else if (completedCount > 0) newStatus = "In Progress";

    setUserProgress(prev => ({ ...prev, [regType]: { status: newStatus, steps: newSteps } }));

    try {
      await api.put(`/registrations`, { type: regType, steps: newSteps, status: newStatus });
    } catch (err) {
      console.error("Failed to save progress", err);
      showToast("Failed to save progress. Please try again.");
    }
  };

  const handleEvidenceUpload = async (regType, stepId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('stepId', stepId);
    formData.append('type', regType);

    try {
      const res = await api.post(`/registrations/upload`, formData);
      setUserProgress(prev => ({
        ...prev,
        [regType]: {
          status: res.data.status,
          steps: res.data.steps
        }
      }));
      showToast("Evidence uploaded successfully!");
    } catch (error) {
      console.error("Upload failed", error);
      showToast("Failed to upload evidence.");
    }
  };

  const handleGenerateDocument = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const payload = { type: genDocType, ...genFormData };
      const res = await api.post('/documents/generate', payload);
      const newDoc = res.data;
      setMyDocs([newDoc, ...myDocs]);
      setShowGenModal(false);
      showToast("Document generated successfully!");
    } catch (err) {
      console.error("Failed to generate document", err);
      showToast("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    try {
      await api.delete(`/documents/${docToDelete}`);
      setMyDocs(prev => prev.filter(doc => doc.id !== docToDelete));
      showToast("Document deleted successfully!");
    } catch (err) {
      console.error("Failed to delete document", err);
      showToast("Failed to delete document");
    } finally {
      setDocToDelete(null);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Sidebar active="documents" onNavigate={onNavigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}>
        <TopBar title="Document Generator" onNavigate={onNavigate} />
        <div className="dashboard-content" style={{ padding: "28px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content" }}>
            {[["generate", "Generate Documents"], ["my-docs", "My Documents"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: activeTab === id ? "white" : "transparent", fontWeight: activeTab === id ? 600 : 400, fontSize: 13, color: activeTab === id ? "#0A1628" : "#64748B", cursor: "pointer", fontFamily: "inherit", boxShadow: activeTab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === "generate" && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: "0 0 20px" }}>Generate Export Documents</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {docTemplates.map(doc => (
                  <div key={doc.title} style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: doc.bg, display: "flex", alignItems: "center", justifyContent: "center", color: doc.color, marginBottom: 16 }}>
                      <Icon name={doc.icon} size={22} />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: "0 0 8px" }}>{doc.title}</h4>
                    <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 18px", lineHeight: 1.5 }}>{doc.desc}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleOpenGenModal(doc.title)} style={{ flex: 1, padding: "9px", background: doc.bg, color: doc.color, border: `1px solid ${doc.color}30`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Generate</button>
                      <button style={{ padding: "9px 12px", background: "white", border: "1px solid #E5E7EB", borderRadius: 8, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
                        <Icon name="download" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload section */}
              <div style={{ marginTop: 24, background: "white", borderRadius: 16, padding: 24, border: "2px dashed #E5E7EB" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#1E6FD9", margin: "0 auto 14px" }}>
                    <Icon name="upload" size={26} />
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: "0 0 6px" }}>Upload Existing Documents</h4>
                  <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>Upload your own documents for storage, verification, and sharing.</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current.click()} disabled={uploading} style={{ padding: "10px 22px", background: uploading ? "#93C5FD" : "#1E6FD9", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                    {uploading ? "Uploading..." : "Choose Files"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "my-docs" && (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #F9FAFB" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", margin: 0 }}>My Documents ({myDocs.length})</h3>
                <button onClick={() => setActiveTab("generate")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#1E6FD9", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon name="plus" size={14} /> New Document
                </button>
              </div>
              {myDocs.length === 0 && <div style={{ fontSize: 14, color: "#9CA3AF", padding: "20px 24px" }}>No documents found. Generate or upload some!</div>}
              {myDocs.map(doc => (
                <div key={doc.id || doc.name} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #F9FAFB" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#1E6FD9", flexShrink: 0 }}>
                    <Icon name="document" size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: "150px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0A1628", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.title || doc.name}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{doc.date || new Date(doc.createdAt).toLocaleDateString()} · {doc.size || 'N/A'}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
                    <Badge color={doc.color || "blue"}>{doc.status}</Badge>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => doc.fileUrl && window.open(`http://localhost:5000${doc.fileUrl}`, '_blank')}
                        style={{ padding: "6px 10px", background: "white", border: "1px solid #E5E7EB", borderRadius: 7, cursor: doc.fileUrl ? "pointer" : "not-allowed", color: "#374151", fontFamily: "inherit", opacity: doc.fileUrl ? 1 : 0.5 }}
                        title="View Document"
                      >
                        <Icon name="eye" size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          if (doc.fileUrl) {
                            try {
                              const response = await fetch(`http://localhost:5000${doc.fileUrl}`);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = doc.title || 'document';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            } catch (e) {
                              console.error(e);
                              showToast("Failed to download file");
                            }
                          }
                        }}
                        style={{ padding: "6px 10px", background: "white", border: "1px solid #E5E7EB", borderRadius: 7, cursor: doc.fileUrl ? "pointer" : "not-allowed", color: "#374151", fontFamily: "inherit", opacity: doc.fileUrl ? 1 : 0.5 }}
                        title="Download Document"
                      >
                        <Icon name="download" size={14} />
                      </button>
                      <button
                        onClick={() => setDocToDelete(doc.id)}
                        style={{ padding: "6px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 7, cursor: "pointer", color: "#EF4444" }}
                        title="Delete Document"
                      >
                        <Icon name="trash-2" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Document Modal */}
      {showGenModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ 
            background: "white", 
            borderRadius: 14, 
            width: "100%", 
            maxWidth: 440,
            transform: `translate(${modalPos.x}px, ${modalPos.y}px)`,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden"
          }}>
            {/* Draggable Header */}
            <div className="modal-drag-handle" onPointerDown={handlePointerDown} style={{ padding: "16px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: isDragging ? "grabbing" : "grab", userSelect: "none", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EFF6FF", color: "#1E6FD9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="document" size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Generate {genDocType}</h3>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Fill required details to create PDF</div>
                </div>
              </div>
              <button type="button" onClick={() => setShowGenModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Form Content */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              <form onSubmit={handleGenerateDocument} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Buyer / Client Name</label>
                    <input required type="text" value={genFormData.buyerName} onChange={e => setGenFormData({ ...genFormData, buyerName: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} />
                  </div>
                  {(genDocType === "Commercial Invoice" || genDocType === "Proforma Invoice" || genDocType === "Packing List") && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Client Address</label>
                      <textarea required rows="2" value={genFormData.buyerAddress} onChange={e => setGenFormData({ ...genFormData, buyerAddress: e.target.value })} placeholder="123 Example St, City, Country" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontFamily: "inherit", fontSize: 13, outline: "none", resize: "vertical", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"}></textarea>
                    </div>
                  )}
                  {genDocType === "Export Contract" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Registered Address</label>
                      <textarea required rows="2" value={genFormData.buyerAddress} onChange={e => setGenFormData({ ...genFormData, buyerAddress: e.target.value })} placeholder="Legal address for contract" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontFamily: "inherit", fontSize: 13, outline: "none", resize: "vertical", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"}></textarea>
                    </div>
                  )}

                  {/* Ports */}
                  {(genDocType === "Commercial Invoice" || genDocType === "Proforma Invoice" || genDocType === "Packing List") && (
                    <>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Port of Loading</label>
                        <input type="text" value={genFormData.portOfLoading} onChange={e => setGenFormData({ ...genFormData, portOfLoading: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Port of Discharge</label>
                        <input type="text" value={genFormData.portOfDischarge} onChange={e => setGenFormData({ ...genFormData, portOfDischarge: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} />
                      </div>
                    </>
                  )}
                </div>

                <div style={{ height: 1, background: "#E2E8F0", margin: "4px 0" }}></div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Product Description</label>
                    <input required type="text" value={genFormData.description} onChange={e => setGenFormData({ ...genFormData, description: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} />
                  </div>

                  {/* Invoice specific fields */}
                  {(genDocType === "Commercial Invoice" || genDocType === "Proforma Invoice") && (
                    <>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>HS Code</label><input type="text" value={genFormData.hsCode} onChange={e => setGenFormData({ ...genFormData, hsCode: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Quantity</label><input required type="number" min="1" value={genFormData.quantity} onChange={e => setGenFormData({ ...genFormData, quantity: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Unit Price (PKR)</label><input required type="number" step="0.01" min="0" value={genFormData.unitPrice} onChange={e => setGenFormData({ ...genFormData, unitPrice: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Payment Terms</label><input type="text" value={genFormData.paymentTerms} onChange={e => setGenFormData({ ...genFormData, paymentTerms: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "#CBD5E1"} /></div>
                    </>
                  )}

                  {/* Packing List specific fields */}
                  {genDocType === "Packing List" && (
                    <>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>HS Code</label><input required type="text" value={genFormData.hsCode} onChange={e => setGenFormData({ ...genFormData, hsCode: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Package Type</label><input required type="text" value={genFormData.packageType} onChange={e => setGenFormData({ ...genFormData, packageType: e.target.value })} placeholder="e.g. Cartons, Pallets" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Total Packages</label><input required type="number" min="1" value={genFormData.totalPackages} onChange={e => setGenFormData({ ...genFormData, totalPackages: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Dimensions (L×W×H)</label><input required type="text" value={genFormData.dimensions} onChange={e => setGenFormData({ ...genFormData, dimensions: e.target.value })} placeholder="e.g. 50x40x30 cm" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Net Weight (kg)</label><input required type="number" step="0.1" min="0" value={genFormData.netWeight} onChange={e => setGenFormData({ ...genFormData, netWeight: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Gross Weight (kg)</label><input required type="number" step="0.1" min="0" value={genFormData.grossWeight} onChange={e => setGenFormData({ ...genFormData, grossWeight: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Package Marking / Shipping Mark</label><input required type="text" value={genFormData.shippingMark} onChange={e => setGenFormData({ ...genFormData, shippingMark: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                    </>
                  )}

                  {/* Export Contract specific fields */}
                  {genDocType === "Export Contract" && (
                    <>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Total Contract Value (PKR)</label><input required type="number" step="0.01" min="0" value={genFormData.contractValue} onChange={e => setGenFormData({ ...genFormData, contractValue: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Incoterms</label><input required type="text" value={genFormData.incoterms} onChange={e => setGenFormData({ ...genFormData, incoterms: e.target.value })} placeholder="e.g. FOB Karachi" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Delivery Date</label>
                        <div style={{ position: "relative" }}>
                          <input required type="date" value={genFormData.deliveryDate} onChange={e => setGenFormData({ ...genFormData, deliveryDate: e.target.value })} style={{ width: "100%", padding: "8px 12px", paddingRight: 32, borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none", color: genFormData.deliveryDate ? "#0F172A" : "#94A3B8" }} />
                          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                            <Calendar size={16} color="#64748B" />
                          </div>
                        </div>
                      </div>
                      <div><label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>Governing Law</label><input required type="text" value={genFormData.governingLaw} onChange={e => setGenFormData({ ...genFormData, governingLaw: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box", fontSize: 13, outline: "none" }} /></div>
                    </>
                  )}
                </div>

                {(genDocType === "Commercial Invoice" || genDocType === "Proforma Invoice") && (
                  <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: 8, textAlign: "right", border: "1px solid #E2E8F0", marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginRight: 8 }}>Total Amount:</span>
                    <span style={{ fontSize: 15, color: "#0F172A", fontWeight: 800 }}>Rs. {Number((genFormData.quantity * genFormData.unitPrice).toFixed(2)).toLocaleString('en-US')} <span style={{ fontSize: 11, color: "#64748B" }}>PKR</span></span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowGenModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "white"}>Cancel</button>
                  <button type="submit" disabled={isGenerating} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#1E6FD9", color: "white", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(30, 111, 217, 0.2)", transition: "background 0.2s" }} onMouseEnter={e => !isGenerating && (e.currentTarget.style.background = "#185CBA")} onMouseLeave={e => !isGenerating && (e.currentTarget.style.background = "#1E6FD9")}>{isGenerating ? "Generating..." : "Generate PDF"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Registration Checklist Modal */}
      {selectedReg && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: 30, borderRadius: 16, width: "100%", maxWidth: 450 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#0A1628" }}>{selectedReg.type}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>{selectedReg.desc}</p>
              </div>
              <button onClick={() => setSelectedReg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <Icon name="x" size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
              {selectedReg.steps.map((step, idx) => {
                const stepData = userProgress[selectedReg.type]?.steps?.[step.id];
                const isChecked = stepData === true || stepData?.completed === true;
                const fileUrl = stepData?.fileUrl;

                return (
                  <div key={step.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px", background: isChecked ? "#F0FDF4" : "#F8FAFC", border: `1px solid ${isChecked ? "#BBF7D0" : "#E5E7EB"}`, borderRadius: 10, transition: "all 0.2s" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: step.type === "upload" ? "default" : "pointer", flex: 1 }}>
                        {step.type !== "upload" && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStep(selectedReg.type, step.id)}
                            style={{ width: 18, height: 18, accentColor: "#10B981", cursor: "pointer", marginTop: 2 }}
                          />
                        )}
                        {step.type === "upload" && isChecked && <div style={{ marginTop: 2 }}><Icon name="check-circle" size={18} color="#10B981" /></div>}
                        {step.type === "upload" && !isChecked && <div style={{ marginTop: 2 }}><Icon name="upload" size={18} color="#9CA3AF" /></div>}

                        <span style={{ fontSize: 14, fontWeight: isChecked ? 600 : 500, color: isChecked ? "#065F46" : "#374151", textDecoration: isChecked ? "line-through" : "none", lineHeight: "1.4" }}>
                          {idx + 1}. {step.label}
                        </span>
                      </label>

                      {step.type === "link" && (
                        <a href={step.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "#1E6FD9", textDecoration: "none", background: "#EFF6FF", padding: "4px 8px", borderRadius: 4, whiteSpace: "nowrap", marginLeft: 8 }}>Portal ↗</a>
                      )}
                    </div>

                    {step.help && (
                      <div style={{ fontSize: 12, color: "#64748B", marginLeft: 30, lineHeight: "1.5" }}>
                        {step.help}
                      </div>
                    )}

                    {step.type === "upload" && (
                      <div style={{ marginLeft: 30, marginTop: 8, display: "flex", gap: 16, alignItems: "center" }}>
                        {isChecked && fileUrl && (
                          <a href={`http://localhost:5000${fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#1E6FD9", fontWeight: 500, textDecoration: "underline" }}>View Evidence</a>
                        )}
                        <label style={{ fontSize: 12, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: "white", padding: "6px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontWeight: 500 }}>
                          <input type="file" onChange={(e) => handleEvidenceUpload(selectedReg.type, step.id, e.target.files[0])} style={{ display: "none" }} />
                          <Icon name="upload" size={14} color="#64748B" />
                          {isChecked ? "Re-upload" : "Upload File"}
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={() => setSelectedReg(null)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#1E6FD9", color: "white", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadein 0.2s" }}>
          <div style={{ background: "white", padding: 32, borderRadius: 20, width: "100%", maxWidth: 400, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "#FEE2E2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name="trash-2" size={24} />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Delete Document</h3>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
                Are you sure you want to permanently delete this document? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDocToDelete(null)} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDeleteDocument} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: "#EF4444", color: "white", fontWeight: 600, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={{ position: "fixed", bottom: 20, right: 20, background: "#0F172A", color: "white", padding: "12px 24px", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", zIndex: 9999, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="info" size={18} color="#38BDF8" />
          {toastMsg}
        </div>
      )}
    </div>
  );
};

// ─── COUNTRY INSIGHTS ─────────────────────────────────────────────────────────
export default Documents;
