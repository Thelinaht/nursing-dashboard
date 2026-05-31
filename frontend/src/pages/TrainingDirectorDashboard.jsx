
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Activity, Award, ClipboardCheck, AlertTriangle, BookOpen,
  Calendar, GraduationCap, TrendingUp, Download, ArrowLeft, ArrowRight,
  Filter, CheckCircle, Clock, Loader, X, Edit, Plus, Edit3, Trash2
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";
import "../styles/DirectorDashboard.css";
import "../styles/TrainingDirectorDashboard.css";

// Aggregated/Static chart data that might not be easily queried yet
const complianceTrend = [
  { month: "Jan", compliance: 78 },
  { month: "Feb", compliance: 82 },
  { month: "Mar", compliance: 85 },
  { month: "Apr", compliance: 88 },
  { month: "May", compliance: 92 },
];

const absenteeTrend = [
  { unit: "ICU", rate: 5 },
  { unit: "ER", rate: 8 },
  { unit: "OR", rate: 3 },
  { unit: "NICU", rate: 6 },
  { unit: "Pediatrics", rate: 2 },
];

const defaultEffectivenessFallback = [
  { course: "BLS Update", preTest: 0, postTest: 0 },
  { course: "ACLS Protocol", preTest: 0, postTest: 0 },
  { course: "Infection Control", preTest: 0, postTest: 0 }
];

const getShortName = (name) => {
  if (!name) return "";
  const mappings = {
    "Advanced Ventilator Operations": "Adv. Ventilator",
    "Aseptic Technique & Sterilization": "Aseptic Tech",
    "Medication Safety Program": "Med. Safety",
    "Triage Protocols & Rapid Assessment": "Triage Protocols",
    "Ventilator Management": "Vent. Mgmt",
    "Fire and Safety": "Fire & Safety",
    "Infection Control": "Infection Ctrl"
  };
  return mappings[name] || name;
};

export default function TrainingDirectorDashboard() {
  const navigate = useNavigate();
  const [activeProgramTab, setActiveProgramTab] = useState("outside");
  const [expiryFilter, setExpiryFilter] = useState("30");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);
  
  // Editing states
  const [editModalData, setEditModalData] = useState(null);
  const [editFields, setEditFields] = useState({});

  // Certification panel filter
  const [certView, setCertView] = useState("specific"); // "general" | "specific"
  // Cert-by-unit chart selected cert
  const [selectedCert, setSelectedCert] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('BLS');
  const [savingEdit, setSavingEdit] = useState(false);

  const needs = dashboardData?.needsAnalysis || {
    competencyGaps: [],
    cpdCompleted: 0,
    cpdRequired: 100,
    newHiresMissingBasics: 0,
    unverifiedFloatStaff: 0
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/training/dashboard/data");
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (type, id, initialData) => {
    setEditModalData({ type, id, title: getEditModalTitle(type, initialData) });
    setEditFields(initialData || {});
  };

  const getEditModalTitle = (type, data) => {
    switch(type) {
      case "mandatory": return `Edit Mandatory Trainings: ${data.name}`;
      case "competency": return `Edit Competency: ${data.nurse} - ${data.competency}`;
      case "add_competency": return "Add Clinical Competency";
      case "certification": return `Edit Certification: ${data.traineeName}`;
      case "add_certification": return "Add Certification & License Tracking";
      case "onboarding": return `Edit Onboarding: ${data.name}`;
      case "intern": return `Edit Intern Placement: ${data.name}`;
      case "add_intern": return "Add Intern / Trainee";
      case "program_item": return `Edit Program Item`;
      case "add_program_item": return "Add Training Program Item";
      default: return "Edit Record";
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const type = editModalData.type;
      const id = editModalData.id;
      
      let bodyData = {};
      if (type === "mandatory") {
        bodyData = {
          type: "mandatory",
          id: id,
          fields: {
            "Saudi Council": { expiry_date: editFields.saudiCouncilExpiry, status: editFields.saudiCouncilStatus },
            "BLS": { expiry_date: editFields.blsExpiry, status: editFields.blsStatus },
            "Fire and Safety": { expiry_date: editFields.fireSafetyExpiry, status: editFields.fireSafetyStatus },
            "Infection Control": { expiry_date: editFields.infectionControlExpiry, status: editFields.infectionControlStatus },
            "Medication Safety Program": { expiry_date: editFields.medicationSafetyExpiry, status: editFields.medicationSafetyStatus },
            "BISCL": { expiry_date: editFields.bisclExpiry, status: editFields.bisclStatus },
            "FMS": { status: editFields.fmsStatus }
          }
        };
      } else if (type === "competency" || type === "add_competency") {
        bodyData = {
          type: "competency",
          id: type === "add_competency" ? editFields.nurse_id : id,
          fields: {
            training_id: editFields.training_id,
            status: editFields.status,
            renewal: editFields.renewal,
            action: editFields.action,
            pre_test_score: editFields.pre_test_score !== "" && editFields.pre_test_score !== null && editFields.pre_test_score !== undefined ? Number(editFields.pre_test_score) : null,
            post_test_score: editFields.post_test_score !== "" && editFields.post_test_score !== null && editFields.post_test_score !== undefined ? Number(editFields.post_test_score) : null
          }
        };
      } else if (type === "certification" || type === "add_certification") {
        // Auto-derive status from expiry date
        const expiryDate = editFields.expiry ? new Date(editFields.expiry) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const derivedStatus = expiryDate && expiryDate < today ? 'Expired' : (editFields.uploadStatus || 'Active');

        bodyData = {
          type: "certification",
          id: type === "add_certification" ? "new" : id,
          fields: {
            trainee_id: editFields.trainee_id,
            name: editFields.name,
            number: editFields.number,
            expiry: editFields.expiry,
            compliance: editFields.compliance,
            uploadStatus: derivedStatus,
            scope: editFields.scope || 'General'
          }
        };
      } else if (type === "onboarding") {
        bodyData = {
          type: "onboarding",
          id: id,
          fields: {
            role: editFields.role,
            preceptor: editFields.preceptor,
            progress: Number(editFields.progress || 0),
            evalScore: editFields.evalScore
          }
        };
      } else if (type === "intern" || type === "add_intern") {
        bodyData = {
          type: "intern",
          id: type === "add_intern" ? "new" : id,
          fields: {
            name: editFields.name,
            university: editFields.university,
            program: editFields.program,
            status: editFields.status,
            unit: editFields.unit || "General",
            start_date: editFields.startDate || new Date().toISOString().split("T")[0],
            end_date: editFields.endDate || null
          }
        };
      } else if (type === "program_item" || type === "add_program_item") {
        bodyData = {
          type: "program_item",
          id: type === "add_program_item" ? "new" : id,
          fields: {
            category: editFields.category,
            title: editFields.title,
            locationProvider: editFields.locationProvider,
            duration: editFields.duration,
            costOrStatus: editFields.costOrStatus
          }
        };
      }

      const res = await fetch("http://localhost:4000/api/training/dashboard/update-row", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Saved ✅");
        setEditModalData(null);
        fetchData();
      } else {
        alert("❌ Save failed: " + (resData.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error saving data");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm("Are you sure you want to delete this training program item?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/training/dashboard/program-item/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        alert("Deleted ✅");
        fetchData();
      } else {
        alert("❌ Delete failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting program item");
    }
  };

  const renderProgressBar = (progress) => {
    let color = "#4caf50";
    if (progress < 50) color = "#ff9800";
    if (progress < 25) color = "#e53935";
    return (
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: color }}></div>
      </div>
    );
  };

  const renderModal = () => {
    if (!modalData) return null;
    return (
      <div className="modal-overlay" onClick={() => setModalData(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '650px', maxWidth: '90%', padding: '25px', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '20px', color: '#2c3e50', margin: 0 }}>{modalData.title}</h2>
            <button className="icon-btn-small" onClick={() => setModalData(null)}><X size={20} /></button>
          </div>
          <div className="custom-table" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="table-header" style={{ gridTemplateColumns: modalData.gridColumns, fontSize: '13px', padding: '12px' }}>
              {modalData.headers.map((h, i) => <span key={i}>{h}</span>)}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {modalData.items.length > 0 ? modalData.items.map((item, i) => (
                <div className="table-row premium-row" key={i} style={{ gridTemplateColumns: modalData.gridColumns, fontSize: '13px', padding: '12px', alignItems: 'center' }}>
                  {modalData.renderRow(item)}
                </div>
              )) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#8ea2b5' }}>No records found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editModalData) return null;
    const { type, id, title } = editModalData;

    const nursesList = (dashboardData?.mandatoryTrainings || []).map(t => ({ id: t.id, name: t.name }));
    const programsList = (dashboardData?.programs || []).filter(p => p.training_category === 'Competency');

    return (
      <div className="modal-overlay" onClick={() => setEditModalData(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '550px', maxWidth: '90%', padding: '25px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '18px', color: '#2c3e50', margin: 0 }}>{title}</h2>
            <button className="icon-btn-small" onClick={() => setEditModalData(null)}><X size={20} /></button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', maxHeight: '60vh', padding: '5px' }}>
            
            {type === "mandatory" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>Update mandatory training status and expiry dates for <b>{editFields.name}</b>:</p>
                
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Saudi Council License</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="date" className="input-pill" style={{ flex: 1 }} value={editFields.saudiCouncilExpiry || ''} onChange={e => setEditFields(prev => ({ ...prev, saudiCouncilExpiry: e.target.value }))} />
                    <select className="input-pill" style={{ flex: 1 }} value={editFields.saudiCouncilStatus || 'Valid'} onChange={e => setEditFields(prev => ({ ...prev, saudiCouncilStatus: e.target.value }))}>
                      <option value="Valid">Valid</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>BLS Certificate</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="date" className="input-pill" style={{ flex: 1 }} value={editFields.blsExpiry || ''} onChange={e => setEditFields(prev => ({ ...prev, blsExpiry: e.target.value }))} />
                    <select className="input-pill" style={{ flex: 1 }} value={editFields.blsStatus || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, blsStatus: e.target.value }))}>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Expired">Expired</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Fire and Safety</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="date" className="input-pill" style={{ flex: 1 }} value={editFields.fireSafetyExpiry || ''} onChange={e => setEditFields(prev => ({ ...prev, fireSafetyExpiry: e.target.value }))} />
                    <select className="input-pill" style={{ flex: 1 }} value={editFields.fireSafetyStatus || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, fireSafetyStatus: e.target.value }))}>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Expired">Expired</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Infection Control</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="date" className="input-pill" style={{ flex: 1 }} value={editFields.infectionControlExpiry || ''} onChange={e => setEditFields(prev => ({ ...prev, infectionControlExpiry: e.target.value }))} />
                    <select className="input-pill" style={{ flex: 1 }} value={editFields.infectionControlStatus || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, infectionControlStatus: e.target.value }))}>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Expired">Expired</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Medication Safety Program</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="date" className="input-pill" style={{ flex: 1 }} value={editFields.medicationSafetyExpiry || ''} onChange={e => setEditFields(prev => ({ ...prev, medicationSafetyExpiry: e.target.value }))} />
                    <select className="input-pill" style={{ flex: 1 }} value={editFields.medicationSafetyStatus || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, medicationSafetyStatus: e.target.value }))}>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Expired">Expired</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>BISCL</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="date" className="input-pill" style={{ flex: 1 }} value={editFields.bisclExpiry || ''} onChange={e => setEditFields(prev => ({ ...prev, bisclExpiry: e.target.value }))} />
                    <select className="input-pill" style={{ flex: 1 }} value={editFields.bisclStatus || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, bisclStatus: e.target.value }))}>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Expired">Expired</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>FMS Status</label>
                  <div style={{ marginTop: '5px' }}>
                    <select className="input-pill" style={{ width: '100%' }} value={editFields.fmsStatus || '✓'} onChange={e => setEditFields(prev => ({ ...prev, fmsStatus: e.target.value }))}>
                      <option value="✓">Completed (✓)</option>
                      <option value="—">Pending (—)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {(type === "competency" || type === "add_competency") && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {type === "add_competency" ? (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Select Trainee</label>
                    <select className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.nurse_id || ''} onChange={e => setEditFields(prev => ({ ...prev, nurse_id: e.target.value }))}>
                      <option value="">-- Choose Trainee --</option>
                      {nursesList.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Trainee</label>
                    <input className="input-pill" style={{ width: '100%', marginTop: '5px', background: '#f5f7fa' }} value={editFields.nurse || ''} disabled />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Competency / Program</label>
                  {type === "add_competency" ? (
                    <select className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.training_id || ''} onChange={e => setEditFields(prev => ({ ...prev, training_id: e.target.value }))}>
                      <option value="">-- Choose Competency --</option>
                      {programsList.map(p => <option key={p.training_id} value={p.training_id}>{p.training_name}</option>)}
                    </select>
                  ) : (
                    <input className="input-pill" style={{ width: '100%', marginTop: '5px', background: '#f5f7fa' }} value={editFields.competency || ''} disabled />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Status</label>
                    <select className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.status || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Expired">Expired</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Renewal Date</label>
                    <input type="date" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.renewal || ''} onChange={e => setEditFields(prev => ({ ...prev, renewal: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Pre-Test Score (%)</label>
                    <input type="number" min="0" max="100" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.pre_test_score || ''} onChange={e => setEditFields(prev => ({ ...prev, pre_test_score: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Post-Test Score (%)</label>
                    <input type="number" min="0" max="100" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.post_test_score || ''} onChange={e => setEditFields(prev => ({ ...prev, post_test_score: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Recommendation & Action Plan</label>
                  <textarea className="input-pill" style={{ width: '100%', height: '80px', marginTop: '5px', borderRadius: '8px', padding: '10px', resize: 'vertical' }} value={editFields.action || ''} onChange={e => setEditFields(prev => ({ ...prev, action: e.target.value }))} placeholder="e.g. Re-verify by clinical supervisor next shift." />
                </div>
              </div>
            )}

            {(type === "certification" || type === "add_certification") && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {type === "add_certification" ? (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Select Trainee Name</label>
                    <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.traineeName || ''} onChange={e => setEditFields(prev => ({ ...prev, traineeName: e.target.value }))} placeholder="Enter trainee full name" />
                    
                    <div style={{ marginTop: '5px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#7f8c8d' }}>Link to Trainee:</span>
                      <select className="input-pill" style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }} value={editFields.trainee_id || ''} onChange={e => {
                        const sel = (dashboardData?.internRequests || []).find(r => String(r.id) === e.target.value);
                        setEditFields(prev => ({ ...prev, trainee_id: e.target.value, traineeName: sel ? sel.name : prev.traineeName }));
                      }}>
                        <option value="">-- Choose Trainee Link --</option>
                        {(dashboardData?.internRequests || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Trainee Name</label>
                    <input className="input-pill" style={{ width: '100%', marginTop: '5px', background: '#f5f7fa' }} value={editFields.traineeName || ''} disabled />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Certificate Name</label>
                  <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.name || ''} onChange={e => setEditFields(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Saudi Council License" />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Cert Number</label>
                    <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.number || ''} onChange={e => setEditFields(prev => ({ ...prev, number: e.target.value }))} placeholder="e.g. CERT-101" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Expiry Date</label>
                    <input type="date" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.expiry || ''} onChange={e => setEditFields(prev => ({ ...prev, expiry: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Compliance %</label>
                    <input type="number" min="0" max="100" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.compliance || ''} onChange={e => setEditFields(prev => ({ ...prev, compliance: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Status</label>
                    <select className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.uploadStatus || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, uploadStatus: e.target.value }))}>
                      <option value="Active">Active / Verified</option>
                      <option value="Pending">Pending Approval</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Scope</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    {['General', 'Specific'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditFields(prev => ({ ...prev, scope: s }))}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px', border: '2px solid',
                          borderColor: (editFields.scope || 'General') === s ? 'var(--accent-blue)' : '#e0e0e0',
                          background: (editFields.scope || 'General') === s ? 'rgba(59,130,246,0.08)' : 'white',
                          color: (editFields.scope || 'General') === s ? 'var(--accent-blue)' : '#7f8c8d',
                          fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {s === 'General' ? '🌐 General' : '🎯 Specific'}
                        <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px', color: 'inherit', opacity: 0.8 }}>
                          {s === 'General' ? 'All nurses' : 'Unit / specialty'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {type === "onboarding" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>New Hire</label>
                  <input className="input-pill" style={{ width: '100%', marginTop: '5px', background: '#f5f7fa' }} value={editFields.name || ''} disabled />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Role</label>
                    <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.role || ''} onChange={e => setEditFields(prev => ({ ...prev, role: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Preceptor</label>
                    <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.preceptor || ''} onChange={e => setEditFields(prev => ({ ...prev, preceptor: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Completion %</label>
                    <input type="number" min="0" max="100" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.progress || ''} onChange={e => setEditFields(prev => ({ ...prev, progress: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Eval Score</label>
                    <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.evalScore || 'Pending'} onChange={e => setEditFields(prev => ({ ...prev, evalScore: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {(type === "intern" || type === "add_intern") && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Applicant Name</label>
                  <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.name || ''} onChange={e => setEditFields(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Noura Al-Sudairi" />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>University</label>
                  <input type="text" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.university || ''} onChange={e => setEditFields(prev => ({ ...prev, university: e.target.value }))} placeholder="e.g. Imam Abdulrahman Bin Faisal University (IAU)" />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Program</label>
                    <select className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.program || 'Intern'} onChange={e => setEditFields(prev => ({ ...prev, program: e.target.value }))}>
                      <option value="Intern">Intern</option>
                      <option value="Student Nurse">Student Nurse</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Status</label>
                    <select className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.status || 'Active'} onChange={e => setEditFields(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Unit Assignment</label>
                  <select className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.unit || 'General'} onChange={e => setEditFields(prev => ({ ...prev, unit: e.target.value }))}>
                    {(dashboardData?.hospitalUnits || []).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Start Date</label>
                    <input type="date" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.startDate || ''} onChange={e => setEditFields(prev => ({ ...prev, startDate: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>End Date</label>
                    <input type="date" className="input-pill" style={{ width: '100%', marginTop: '5px' }} value={editFields.endDate || ''} onChange={e => setEditFields(prev => ({ ...prev, endDate: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {(type === "program_item" || type === "add_program_item") && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>Category</label>
                  <select 
                    className="input-pill" 
                    style={{ width: '100%', marginTop: '5px' }} 
                    value={editFields.category || 'outside'} 
                    onChange={e => setEditFields(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="outside">Outside Hospital</option>
                    <option value="inside">Inside Hospital</option>
                    <option value="cross">Cross-Training</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>
                    {editFields.category === "outside" ? "Program / Course Title" :
                     editFields.category === "inside" ? "Workshop / Course Title" : "Staff Name"}
                  </label>
                  <input 
                    type="text" 
                    className="input-pill" 
                    style={{ width: '100%', marginTop: '5px' }} 
                    value={editFields.title || ''} 
                    onChange={e => setEditFields(prev => ({ ...prev, title: e.target.value }))} 
                    placeholder={
                      editFields.category === "outside" ? "e.g. Advanced Trauma Life Support" :
                      editFields.category === "inside" ? "e.g. IV Therapy Recertification" : "e.g. M. Ali"
                    }
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>
                    {editFields.category === "outside" ? "Location / Provider" :
                     editFields.category === "inside" ? "Internal Location" : "Deployment Route"}
                  </label>
                  <input 
                    type="text" 
                    className="input-pill" 
                    style={{ width: '100%', marginTop: '5px' }} 
                    value={editFields.locationProvider || ''} 
                    onChange={e => setEditFields(prev => ({ ...prev, locationProvider: e.target.value }))} 
                    placeholder={
                      editFields.category === "outside" ? "e.g. King Fahad Hospital" :
                      editFields.category === "inside" ? "e.g. Main Hall A" : "e.g. NICU ➔ Pediatric Ward"
                    }
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>
                      {editFields.category === "outside" ? "Duration" :
                       editFields.category === "inside" ? "Duration" : "Timeline"}
                    </label>
                    <input 
                      type="text" 
                      className="input-pill" 
                      style={{ width: '100%', marginTop: '5px' }} 
                      value={editFields.duration || ''} 
                      onChange={e => setEditFields(prev => ({ ...prev, duration: e.target.value }))} 
                      placeholder={
                        editFields.category === "outside" ? "e.g. 3 Days" :
                        editFields.category === "inside" ? "e.g. 4 Hours" : "e.g. Starts: 2026-06-01"
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e' }}>
                      {editFields.category === "outside" ? "Cost / Fees" :
                       editFields.category === "inside" ? "Notes / Status" : "Current Status"}
                    </label>
                    <input 
                      type="text" 
                      className="input-pill" 
                      style={{ width: '100%', marginTop: '5px' }} 
                      value={editFields.costOrStatus || ''} 
                      onChange={e => setEditFields(prev => ({ ...prev, costOrStatus: e.target.value }))} 
                      placeholder={
                        editFields.category === "outside" ? "e.g. $450" :
                        editFields.category === "inside" ? "e.g. Active" : "e.g. Active"
                      }
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <button className="save-btn" style={{ background: '#7f8c8d' }} onClick={() => setEditModalData(null)}>Cancel</button>
            <button className="save-btn" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout role="trainingDirector" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Training Director"}>
      <div className="main training-dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>


{/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Loader className="spin" size={40} color="var(--accent-blue)" />
            <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading Dashboard Data...</p>
          </div>
        ) : (
          <>
            {/* 1. Overview KPI Cards */}
            <div className="cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
              <div className="glass-card blue clickable-card" onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}>
                <p><GraduationCap size={22} /> Staff Trained</p>
                <h1>{dashboardData?.stats?.totalTrained || 0}</h1>
              </div>

              <div className={`glass-card ${
                Number(dashboardData?.stats?.compliance) >= 80 ? 'green' :
                Number(dashboardData?.stats?.compliance) >= 50 ? 'yellow' : 'red'
              }`}>
                <p><CheckCircle size={22} /> Compliance</p>
                <h1>{dashboardData?.stats?.compliance || 0}%</h1>
              </div>

              <div className="glass-card red clickable-card"
                onClick={() => setModalData({
                  title: "Expiring & Expired Certificates",
                  gridColumns: "2fr 1fr 1fr",
                  headers: ["Trainee Name", "Certificate", "Expiry / Status"],
                  items: (dashboardData?.certTracker || []).filter(c => c.uploadStatus === 'Expired' || new Date(c.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                  renderRow: (item) => <><span style={{ fontWeight: 600 }}>{item.traineeName || 'Unknown'}</span><span style={{ color: '#e53935' }}>{item.name}</span><span style={{ fontWeight: 'bold', color: '#e53935' }}>{item.uploadStatus === 'Expired' ? 'Expired' : item.expiry}</span></>
                })}>
                <p><AlertTriangle size={22} /> Expiring Certs</p>
                <h1>{dashboardData?.stats?.expiring || 0}</h1>
              </div>

              <div className="glass-card yellow clickable-card"
                onClick={() => setModalData({
                  title: "Trainees with Overdue Mandatory Training",
                  gridColumns: "1fr",
                  headers: ["Trainee Name"],
                  items: (dashboardData?.mandatoryTrainings || []).filter(m => m.isRed),
                  renderRow: (item) => <span style={{ fontWeight: 600, color: '#e65100' }}>{item.name}</span>
                })}>
                <p><Clock size={22} /> Overdue</p>
                <h1>{dashboardData?.stats?.overdue || 0}</h1>
              </div>

              <div className="glass-card purple clickable-card"
                onClick={() => setModalData({
                  title: "Active Interns",
                  gridColumns: "1fr 1fr 1fr",
                  headers: ["Name", "University", "Program"],
                  items: (dashboardData?.internRequests || []),
                  renderRow: (item) => <><span style={{ fontWeight: 600 }}>{item.name}</span><span>{item.university}</span><span style={{ color: '#6a1b9a' }}>{item.program}</span></>
                })}>
                <p><Users size={22} /> Active Interns</p>
                <h1>{dashboardData?.stats?.interns || 0}</h1>
              </div>
            </div>

            <div className="panel-row">
              {/* 2. Mandatory Training Compliance Table/Panel */}
              <div className="table-box content-box" style={{ flex: 2 }}>
                <div className="box-header">
                  <h2 className="content-box-title">Mandatory Training Compliance</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select className="input-pill" value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)}>
                      <option value="30">Alerts: 30 Days</option>
                      <option value="60">Alerts: 60 Days</option>
                      <option value="90">Alerts: 90 Days</option>
                    </select>
                    <button className="icon-btn-small" title="Export" onClick={() => window.print()}><Download size={16} /></button>
                  </div>
                </div>

                <div className="custom-table" style={{ marginTop: '10px' }}>
                  <div className="table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr', fontSize: '11px', padding: '10px 5px' }}>
                    <span>Name</span>
                    <span>Saudi Council</span>
                    <span>BLS</span>
                    <span>Fire and Safety</span>
                    <span>Infection Control</span>
                    <span>Medication Safety Program</span>
                    <span>BISCL</span>
                    <span>FMS</span>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {(dashboardData?.mandatoryTrainings || []).map((t) => (
                      <div className="table-row premium-row" key={t.id} style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr', padding: '10px 5px', fontSize: '11px' }}>
                        <span style={{ fontWeight: 600, color: t.isRed ? '#e53935' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {t.name}
                          <button className="icon-btn-small" style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }} title="Edit Trainings" onClick={() => handleEditClick("mandatory", t.id, {
                            name: t.name,
                            saudiCouncilExpiry: t.saudiCouncil?.split("T")[0] || "",
                            saudiCouncilStatus: t.saudiCouncil ? "Valid" : "Expired",
                            blsExpiry: t.bls?.split("T")[0] || "",
                            blsStatus: t.bls ? "Completed" : "Pending",
                            fireSafetyExpiry: t.fireSafety?.split("T")[0] || "",
                            fireSafetyStatus: t.fireSafety ? "Completed" : "Pending",
                            infectionControlExpiry: t.infectionControl?.split("T")[0] || "",
                            infectionControlStatus: t.infectionControl ? "Completed" : "Pending",
                            medicationSafetyExpiry: t.medicationSafety?.split("T")[0] || "",
                            medicationSafetyStatus: t.medicationSafety ? "Completed" : "Pending",
                            bisclExpiry: t.biscl?.split("T")[0] || "",
                            bisclStatus: t.biscl ? "Completed" : "Pending",
                            fmsStatus: t.fms === "✓" ? "✓" : "—"
                          })}>
                            <Edit size={11} color="var(--accent-blue)" />
                          </button>
                        </span>
                        <span style={{ color: t.isRed && t.saudiCouncil?.includes('2024') ? '#e53935' : 'inherit' }}>{t.saudiCouncil || '—'}</span>
                        <span style={{ color: t.isRed && t.bls?.includes('2024') ? '#e53935' : 'inherit' }}>{t.bls || '—'}</span>
                        <span style={{ color: t.isRed && t.fireSafety?.includes('2024') ? '#e53935' : 'inherit' }}>{t.fireSafety || '—'}</span>
                        <span style={{ color: t.isRed && t.infectionControl?.includes('2024') ? '#e53935' : 'inherit' }}>{t.infectionControl || '—'}</span>
                        <span style={{ color: t.isRed && t.medicationSafety?.includes('2024') ? '#e53935' : 'inherit' }}>{t.medicationSafety || '—'}</span>
                        <span style={{ color: t.isRed && t.biscl?.includes('2024') ? '#e53935' : 'inherit' }}>{t.biscl || '—'}</span>
                        <span>{t.fms}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend Line inside the panel */}
                <div style={{ height: "180px", marginTop: "20px" }}>
                  <p style={{ fontSize: "12px", color: "#8ea2b5", marginBottom: "5px" }}>Compliance Trend Over Time</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={complianceTrend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin - 5', 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="compliance" stroke="#4caf50" fill="rgba(76, 175, 80, 0.2)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 8. Training Needs Analysis Panel (Heatmap / Gaps) */}
              <div className="table-box content-box" style={{ flex: 1 }}>
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="content-box-title">Training Needs Analysis</h2>
                  <button 
                    onClick={() => navigate('/training/needs-analysis')}
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--accent-blue)",
                      background: "transparent",
                      color: "var(--accent-blue)",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Show All Units
                  </button>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px" }}>Competency Gaps by Unit</p>
                <div className="heatmap-grid">
                  {needs.competencyGaps && needs.competencyGaps.length > 0 ? (
                    needs.competencyGaps.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="heatmap-cell" style={{ background: item.color }}>
                        {item.unit}
                        <span className="heatmap-label">{item.gapLevel} ({item.gapPercent}%)</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "10px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
                      No competency data available.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h4 style={{ fontSize: "13px", color: "#4a6a85", marginBottom: "10px" }}>CPD/CME Completion Progress</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                    <span>Required: {needs.cpdRequired} hrs</span>
                    <span>Completed: {needs.cpdCompleted} hrs</span>
                  </div>
                  {renderProgressBar((needs.cpdCompleted / (needs.cpdRequired || 1)) * 100)}
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h4 style={{ fontSize: "13px", color: "#4a6a85", marginBottom: "10px" }}>High-Risk Staff Flags</h4>
                  <div className="stat-item">
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>New Hires (Missing Basics)</span>
                    <span className="badge high-risk" style={{ width: "auto" }}>{needs.newHiresMissingBasics}</span>
                  </div>
                  <div className="stat-item">
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Float Staff (Unverified)</span>
                    <span className="badge critical" style={{ width: "auto" }}>{needs.unverifiedFloatStaff}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-row">
              {/* 3. Clinical Competency Assessment Panel */}
              <div className="table-box content-box" style={{ flex: 2 }}>
                <div className="box-header">
                  <h2 className="content-box-title">Clinical Competency Assessment</h2>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="icon-btn-small" title="Add Competency" onClick={() => handleEditClick("add_competency", "new", { status: 'Completed' })}><Plus size={16} /></button>
                    <button className="icon-btn-small" title="Filter" onClick={() => alert("Filter functionality would open a modal here")}><Filter size={16} /></button>
                  </div>
                </div>
                <div className="custom-table" style={{ marginTop: '10px' }}>
                  <div className="table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr 1.5fr' }}>
                    <span>Trainee</span>
                    <span>Unit</span>
                    <span>Competency</span>
                    <span>Status</span>
                    <span>Renewal</span>
                    <span>Recommendation</span>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {(dashboardData?.clinicalCompetencies || []).map((c, idx) => (
                      <div className="table-row premium-row" key={idx} style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr 1.5fr', padding: '12px 10px', fontSize: '12px' }}>
                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.nurse}
                          <button className="icon-btn-small" style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }} title="Edit Competency" onClick={() => handleEditClick("competency", c.id, {
                            nurse: c.nurse,
                            competency: c.competency,
                            training_id: c.training_id,
                            status: c.status,
                            renewal: c.renewal,
                            action: c.action,
                            pre_test_score: c.pre_test_score || "",
                            post_test_score: c.post_test_score || ""
                          })}>
                            <Edit size={11} color="var(--accent-blue)" />
                          </button>
                        </span>
                        <span>{c.specialty}</span>
                        <span>{c.competency}</span>
                        <span style={{ color: c.status === "Completed" ? "#4caf50" : "#ff9800", fontWeight: "bold" }}>{c.status}</span>
                        <span>{c.renewal}</span>
                        <span style={{ color: "#8ea2b5", fontStyle: "italic" }}>{c.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Learning Outcomes & Evaluations Panel */}
              <div className="table-box content-box" style={{ flex: 1 }}>
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="content-box-title">Learning Outcomes</h2>
                  <button 
                    onClick={() => navigate('/training/learning-outcomes')}
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--accent-blue)",
                      background: "transparent",
                      color: "var(--accent-blue)",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Show Details
                  </button>
                </div>
                <p style={{ fontSize: "12px", color: "#8ea2b5", marginTop: "10px", marginBottom: "15px" }}>Pre vs. Post Test Scores (%)</p>
                <div style={{ height: "230px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={dashboardData?.learningOutcomes && dashboardData.learningOutcomes.length > 0 
                        ? dashboardData.learningOutcomes.map(item => ({ ...item, course: getShortName(item.course) })) 
                        : defaultEffectivenessFallback} 
                      margin={{ top: 5, right: 5, left: -20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis 
                        dataKey="course" 
                        tick={{ fontSize: 9, fill: "var(--text-secondary)" }} 
                        axisLine={false} 
                        tickLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={55}
                      />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="preTest" name="Pre-Test" fill="#9cb5f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="postTest" name="Post-Test" fill="#6082e6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="panel-row">
              {/* 7. Certification & License Tracking Panel */}
              <div className="table-box content-box" style={{ flex: 2 }}>
                <div className="box-header">
                  <h2 className="content-box-title">Certification & License Tracking</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* General / Specific toggle */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                      <button
                        onClick={() => setCertView('general')}
                        style={{
                          padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s',
                          background: certView === 'general' ? 'var(--accent-blue)' : 'transparent',
                          color: certView === 'general' ? 'white' : 'var(--text-secondary)'
                        }}
                      >General</button>
                      <button
                        onClick={() => setCertView('specific')}
                        style={{
                          padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s',
                          background: certView === 'specific' ? 'var(--accent-blue)' : 'transparent',
                          color: certView === 'specific' ? 'white' : 'var(--text-secondary)'
                        }}
                      >Specific</button>
                    </div>
                    <button className="icon-btn-small" title="Add Certification" onClick={() => handleEditClick("add_certification", "new", { compliance: 100, uploadStatus: 'Active' })}><Plus size={16} /></button>
                    <button className="icon-btn-small" title="Export" onClick={() => window.print()}><Download size={16} /></button>
                  </div>
                </div>

                {/* ── Shared cert table: filtered by scope from Certification_License_Tracking ── */}
                {(() => {
                  const allCerts = dashboardData?.certTracker || [];
                  // Filter by scope field (add scope column to DB: ALTER TABLE Certification_License_Tracking ADD COLUMN scope ENUM('General','Specific') DEFAULT 'General')
                  const rows = allCerts.filter(c =>
                    c.scope ? c.scope === (certView === 'general' ? 'General' : 'Specific') : true
                  );
                  return (
                    <div className="custom-table" style={{ marginTop: '10px' }}>
                      <div className="table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 1fr 1fr' }}>
                        <span>Trainee Name</span>
                        <span>Cert Name</span>
                        <span>Number</span>
                        <span>Expiry Date</span>
                        <span>Compliance %</span>
                        <span>Status</span>
                      </div>
                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {rows.map(c => (
                          <div className="table-row premium-row" key={c.id}
                            style={{ gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 1fr 1fr', padding: '12px 10px', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {c.traineeName || '—'}
                              <button className="icon-btn-small"
                                style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                title="Edit Certificate"
                                onClick={() => handleEditClick("certification", c.id, {
                                  traineeName: c.traineeName, name: c.name, number: c.number,
                                  expiry: c.expiry, compliance: c.compliance, uploadStatus: c.uploadStatus
                                })}>
                                <Edit size={11} color="var(--accent-blue)" />
                              </button>
                            </span>
                            <span>{c.name || '—'}</span>
                            <span>{c.number || '—'}</span>
                            <span>{c.expiry || '—'}</span>
                            <span style={{ fontWeight: 'bold', color: Number(c.compliance) >= 80 ? '#4caf50' : Number(c.compliance) >= 50 ? '#ff9800' : '#e53935' }}>
                              {Number(c.compliance || 0).toFixed(0)}%
                            </span>
                            <span className={`status ${c.uploadStatus === 'Active' || c.uploadStatus === 'Verified' ? 'approved' : c.uploadStatus === 'Expired' ? 'rejected' : 'pending'}`}
                              style={{ fontSize: '11px', padding: '4px 10px', width: 'fit-content', textAlign: 'center' }}>
                              {c.uploadStatus || 'Pending'}
                            </span>
                          </div>
                        ))}
                        {rows.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#8ea2b5' }}>
                            No {certView} certifications found.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 5. Staff Participation & Attendance */}
              <div className="table-box content-box" style={{ flex: 1 }}>
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="content-box-title">Staff Participation &amp; Attendance</h2>
                  <button 
                    onClick={() => navigate('/training/participation')}
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--accent-blue)",
                      background: "transparent",
                      color: "var(--accent-blue)",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Show All Units
                  </button>
                </div>

                {/* cert selector + stacked bar + detail table */}
                {(() => {
                  const programs = dashboardData?.programs || [];
                  const courseNames = [...new Set(programs.map(p => p.training_name))].filter(Boolean).sort();
                  const activeCourse = selectedCourse || courseNames[0] || 'BLS';
                  
                  const stats = dashboardData?.participationStats?.[activeCourse] || {
                    overallNoShowRate: 4.2,
                    avgHrsPerStaff: 8.5,
                    unitData: [
                      { unit: "ICU", rate: 5.2 },
                      { unit: "ER", rate: 8.5 },
                      { unit: "OR", rate: 3.0 },
                      { unit: "NICU", rate: 6.4 },
                      { unit: "Pediatrics", rate: 2.0 }
                    ]
                  };

                  const displayedUnitData = (stats.unitData || []).filter(d => ["ICU", "ER", "OR", "NICU", "Pediatrics"].includes(d.unit));

                  return (
                    <>
                      {/* stat tiles */}
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <div style={{ flex: 1, background: "rgba(242,157,145,0.15)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(242,157,145,0.3)" }}>
                          <h3 style={{ color: "#e53935", fontSize: "22px", margin: 0 }}>
                            {stats.overallNoShowRate}%
                          </h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "11px", margin: "4px 0 0" }}>Overall No-Show Rate</p>
                        </div>
                        <div style={{ flex: 1, background: "rgba(76,175,80,0.15)", borderRadius: "8px", padding: "12px", textAlign: "center", border: "1px solid rgba(76,175,80,0.3)" }}>
                          <h3 style={{ color: "#4caf50", fontSize: "22px", margin: 0 }}>{stats.avgHrsPerStaff}h</h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "11px", margin: "4px 0 0" }}>Avg Training Hrs/Staff</p>
                        </div>
                      </div>

                      <div style={{ marginTop: "12px" }}>
                        {/* dropdown */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <p style={{ fontSize: "11px", color: "#8ea2b5", margin: 0, whiteSpace: "nowrap" }}>Course —</p>
                          <select
                            value={activeCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #dde3ea", background: "white", color: "#243647", flex: 1 }}
                          >
                            {courseNames.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>

                        <p style={{ fontSize: "12px", color: "#8ea2b5", textAlign: "center", margin: "5px 0 10px 0" }}>Absentee Trend by Unit (%)</p>

                        {/* bar chart */}
                        <div style={{ height: "130px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayedUnitData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                              <XAxis 
                                dataKey="unit" 
                                interval={0} 
                                tick={{ fontSize: 9 }} 
                                height={30}
                                angle={0}
                                textAnchor="middle"
                                axisLine={false} 
                                tickLine={false} 
                              />
                              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} formatter={(val) => [val + "%", "No-Show Rate"]} />
                              <Bar dataKey="rate" fill="#f29d91" radius={[4,4,0,0]} barSize={28} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>


            </div>

            <div className="panel-row">
              {/* 9. Onboarding & Orientation Tracker */}
              <div className="table-box content-box" style={{ flex: 2 }}>
                <div className="box-header">
                  <h2 className="content-box-title">Onboarding & Orientation Tracker</h2>
                </div>
                <div className="custom-table" style={{ marginTop: '10px' }}>
                  <div className="table-header" style={{ gridTemplateColumns: '1fr 0.5fr 1fr 1.5fr 1fr' }}>
                    <span>New Hire</span>
                    <span>Role</span>
                    <span>Preceptor</span>
                    <span>Completion %</span>
                    <span>Eval Score</span>
                  </div>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {(dashboardData?.onboardingData || []).map((o, idx) => (
                      <div className="table-row premium-row" key={idx} style={{ gridTemplateColumns: '1fr 0.5fr 1fr 1.5fr 1fr', padding: '12px 10px', fontSize: '12px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {o.name}
                          <button className="icon-btn-small" style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }} title="Edit Onboarding" onClick={() => handleEditClick("onboarding", o.id, {
                            name: o.name,
                            role: o.role,
                            preceptor: o.preceptor,
                            progress: o.progress,
                            evalScore: o.evalScore
                          })}>
                            <Edit size={11} color="var(--accent-blue)" />
                          </button>
                        </span>
                        <span>{o.role}</span>
                        <span>{o.preceptor}</span>
                        <div style={{ paddingRight: "15px" }}>
                          <span style={{ fontSize: "11px", color: "#8ea2b5" }}>{o.progress}%</span>
                          {renderProgressBar(o.progress)}
                        </div>
                        <span style={{ fontWeight: "bold", color: o.evalScore === "Pending" ? "#ff9800" : "#243647" }}>{o.evalScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Training Programs Section (Tabbed) */}
              <div className="table-box content-box" style={{ flex: 1 }}>
                <div className="box-header" style={{ marginBottom: "10px" }}>
                  <h2 className="content-box-title">Training Programs</h2>
                  <button 
                    className="icon-btn-small" 
                    title="Add Program Item" 
                    onClick={() => handleEditClick("add_program_item", "new", { category: activeProgramTab })}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="tab-container">
                  <button className={`tab-btn ${activeProgramTab === "outside" ? "active" : ""}`} onClick={() => setActiveProgramTab("outside")}>Outside Hospital</button>
                  <button className={`tab-btn ${activeProgramTab === "inside" ? "active" : ""}`} onClick={() => setActiveProgramTab("inside")}>Inside Hospital</button>
                  <button className={`tab-btn ${activeProgramTab === "cross" ? "active" : ""}`} onClick={() => setActiveProgramTab("cross")}>Cross-Training</button>
                </div>

                <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: "8px", padding: "15px", minHeight: "150px" }}>
                  <h4 style={{ fontSize: "14px", color: "#243647", marginBottom: "10px", textTransform: "capitalize" }}>
                    {activeProgramTab === "outside" ? "Recent Outside Programs" :
                     activeProgramTab === "inside" ? "Internal Workshops" : "Cross-Training Deployments"}
                  </h4>
                  {((dashboardData?.programItems || []).filter(item => item.category === activeProgramTab)).length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#8ea2b5", fontStyle: "italic", textAlign: "center", marginTop: "30px" }}>
                      No programs recorded for this category.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {((dashboardData?.programItems || []).filter(item => item.category === activeProgramTab)).map(item => (
                        <div 
                          key={item.id} 
                          style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            background: "#fff", 
                            padding: "10px 12px", 
                            borderRadius: "6px", 
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
                          }}
                        >
                          <div style={{ fontSize: "13px", color: "#5a738e" }}>
                            <strong style={{ color: "#243647" }}>{item.title}</strong>
                            {item.locationProvider && (
                              <>
                                {" - "}<i>{item.locationProvider}</i>
                              </>
                            )}
                            {item.duration && (
                              <span style={{ color: "#8ea2b5", marginLeft: "5px" }}>({item.duration})</span>
                            )}
                            {item.costOrStatus && (
                              <span style={{ 
                                marginLeft: "8px", 
                                background: activeProgramTab === "outside" ? "rgba(46, 204, 113, 0.1)" : "rgba(52, 152, 219, 0.1)",
                                color: activeProgramTab === "outside" ? "#2ecc71" : "#3498db",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "bold"
                              }}>
                                {item.costOrStatus}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button 
                              className="icon-btn-small" 
                              style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }} 
                              title="Edit Program" 
                              onClick={() => handleEditClick("program_item", item.id, {
                                category: item.category,
                                title: item.title,
                                locationProvider: item.locationProvider || '',
                                duration: item.duration || '',
                                costOrStatus: item.costOrStatus || ''
                              })}
                            >
                              <Edit size={13} color="var(--accent-blue)" />
                            </button>
                            <button 
                              className="icon-btn-small" 
                              style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }} 
                              title="Delete Program" 
                              onClick={() => handleDeleteProgram(item.id)}
                            >
                              <Trash2 size={13} color="#e74c3c" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 10. Nursing Intern Management Panel */}
            <div className="table-box content-box">
              <div className="box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} color="var(--accent-blue)" />
                  <h2 className="content-box-title">Nursing Intern Management</h2>
                </div>
                <button className="icon-btn-small" title="Add Intern" onClick={() => handleEditClick("add_intern", "new", { program: 'Intern', status: 'Active', unit: 'General', startDate: new Date().toISOString().split("T")[0] })}><Plus size={16} /></button>
              </div>
              <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>

                {/* Intern Stats */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(() => {
                    const interns = dashboardData?.internRequests || [];
                    const isIAU = (u) => u?.toLowerCase().includes('iau') || u?.toLowerCase().includes('imam abdulrahman');
                    // IAU = any trainee (Intern or Student Nurse) from IAU university
                    const iauCount    = interns.filter(r => isIAU(r.university)).length;
                    // Non-IAU Interns = Interns from non-IAU universities
                    const nonIauCount = interns.filter(r => r.program === 'Intern' && !isIAU(r.university)).length;
                    // Summer Training = Student Nurses from non-IAU universities
                    const summerCount = interns.filter(r => r.program === 'Student Nurse' && !isIAU(r.university)).length;
                    return (
                      <>
                        <div style={{ background: "rgba(96, 130, 230, 0.1)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 500, color: "#4a6a85" }}>IAU Interns</span>
                          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#6082e6" }}>{iauCount}</span>
                        </div>
                        <div style={{ background: "rgba(156, 181, 241, 0.1)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 500, color: "#4a6a85" }}>Non-IAU Interns</span>
                          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#9cb5f1" }}>{nonIauCount}</span>
                        </div>
                        <div style={{ background: "rgba(242, 157, 145, 0.1)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 500, color: "#4a6a85" }}>Summer Training</span>
                          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#f29d91" }}>{summerCount}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Intern Requests Table */}
                <div className="custom-table" style={{ flex: 2 }}>
                  <div className="table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.6fr 1fr' }}>
                    <span>Applicant Name</span>
                    <span>University</span>
                    <span>Program</span>
                    <span>Training Period</span>
                    <span>Status</span>
                  </div>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {(dashboardData?.internRequests || []).map((req) => (
                      <div className="table-row premium-row" key={req.id} style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.6fr 1fr', padding: '12px 15px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {req.name}
                          <button className="icon-btn-small" style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }} title="Edit Intern" onClick={() => handleEditClick("intern", req.id, {
                            name: req.name,
                            university: req.university,
                            program: req.program,
                            status: req.status,
                            unit: req.unit || "General",
                            startDate: req.startDate || "",
                            endDate: req.endDate || ""
                          })}>
                            <Edit size={11} color="var(--accent-blue)" />
                          </button>
                        </span>
                        <span>{req.university}</span>
                        <span style={{ color: "var(--text-secondary)" }}>{req.program}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          {req.startDate && req.endDate 
                            ? `${req.startDate} to ${req.endDate}` 
                            : req.startDate || req.endDate || "—"}
                        </span>
                        <span className={`status ${req.status.toLowerCase()}`} style={{ fontSize: '11px', padding: '4px 10px', textAlign: 'center', width: 'fit-content' }}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {renderModal()}
        {renderEditModal()}
      </div>
    </Layout>
  );
}
