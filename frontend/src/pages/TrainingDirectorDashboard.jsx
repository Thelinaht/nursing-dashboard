import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Activity, Award, ClipboardCheck, AlertTriangle, BookOpen,
  Calendar, GraduationCap, TrendingUp, Download, ArrowLeft, ArrowRight,
  Filter, CheckCircle, Clock, Loader, X
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

const trainingEffectiveness = [
  { course: "BLS Update", preTest: 65, postTest: 92 },
  { course: "ACLS Protocol", preTest: 58, postTest: 88 },
  { course: "Infection Control", preTest: 70, postTest: 95 },
  { course: "ECG Basics", preTest: 50, postTest: 85 },
];

export default function TrainingDirectorDashboard() {
  const navigate = useNavigate();
  const [activeProgramTab, setActiveProgramTab] = useState("outside");
  const [expiryFilter, setExpiryFilter] = useState("30");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch("http://localhost:4000/api/training/dashboard/data");
            const data = await res.json();
            setDashboardData(data);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

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

  return (
    <Layout role="trainingDirector" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Training Director"}>
      <div className="main training-dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Navigation Controls */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button className="icon-btn-small" onClick={() => navigate(-1)} title="Back">
            <ArrowLeft size={18} />
          </button>
          <button className="icon-btn-small" onClick={() => navigate(1)} title="Forward">
            <ArrowRight size={18} />
          </button>
        </div>

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
              
              <div className="wave-card glass-card clickable-card" style={{ background: '#e1f5fe', border: '1px solid rgba(41, 182, 246, 0.3)', cursor: 'pointer' }}
                   onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}>
                <p style={{ color: '#0277bd' }}><i><GraduationCap size={16} /></i> Staff Trained</p>
                <h1 style={{ color: '#0277bd' }}>{dashboardData?.stats?.totalTrained || 0}</h1>
              </div>

              <div className="wave-card glass-card" style={{ background: '#e8f5e9', border: '1px solid rgba(102, 187, 106, 0.3)' }}>
                <p style={{ color: '#2e7d32' }}><i><CheckCircle size={16} /></i> Compliance</p>
                <h1 style={{ color: '#2e7d32' }}>{dashboardData?.stats?.compliance || 0}%</h1>
              </div>

              <div className="wave-card glass-card clickable-card" style={{ background: '#ffebee', border: '1px solid rgba(239, 83, 80, 0.3)', cursor: 'pointer' }}
                   onClick={() => setModalData({
                     title: "Expiring & Expired Certificates",
                     gridColumns: "2fr 1fr 1fr",
                     headers: ["Nurse Name", "Certificate", "Expiry / Status"],
                     items: (dashboardData?.certTracker || []).filter(c => c.uploadStatus === 'Expired' || new Date(c.expiry) < new Date(Date.now() + 30*24*60*60*1000)),
                     renderRow: (item) => <><span style={{fontWeight:600}}>{item.nurseName || 'Unknown'}</span><span style={{color:'#e53935'}}>{item.name}</span><span style={{fontWeight:'bold', color:'#e53935'}}>{item.uploadStatus === 'Expired' ? 'Expired' : item.expiry}</span></>
                   })}>
                <p style={{ color: '#c62828' }}><i><AlertTriangle size={16} /></i> Expiring Certs</p>
                <h1 style={{ color: '#c62828' }}>{dashboardData?.stats?.expiring || 0}</h1>
              </div>

              <div className="wave-card glass-card clickable-card" style={{ background: '#fff3e0', border: '1px solid rgba(255, 152, 0, 0.3)', cursor: 'pointer' }}
                   onClick={() => setModalData({
                     title: "Nurses with Overdue Mandatory Training",
                     gridColumns: "1fr",
                     headers: ["Nurse Name"],
                     items: (dashboardData?.mandatoryTrainings || []).filter(m => m.isRed),
                     renderRow: (item) => <span style={{fontWeight:600, color:'#e65100'}}>{item.name}</span>
                   })}>
                <p style={{ color: '#e65100' }}><i><Clock size={16} /></i> Overdue</p>
                <h1 style={{ color: '#e65100' }}>{dashboardData?.stats?.overdue || 0}</h1>
              </div>

              <div className="wave-card glass-card clickable-card" style={{ background: '#f3e5f5', border: '1px solid rgba(171, 71, 188, 0.3)', cursor: 'pointer' }}
                   onClick={() => setModalData({
                     title: "Active Interns",
                     gridColumns: "1fr 1fr 1fr",
                     headers: ["Name", "University", "Program"],
                     items: (dashboardData?.internRequests || []),
                     renderRow: (item) => <><span style={{fontWeight:600}}>{item.name}</span><span>{item.university}</span><span style={{color:'#6a1b9a'}}>{item.program}</span></>
                   })}>
                <p style={{ color: '#6a1b9a' }}><i><Users size={16} /></i> Active Interns</p>
                <h1 style={{ color: '#6a1b9a' }}>{dashboardData?.stats?.interns || 0}</h1>
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
                    <span style={{ fontWeight: 600, color: t.isRed ? '#e53935' : 'inherit' }}>{t.name}</span>
                    <span style={{ color: t.isRed && t.saudiCouncil.includes('2024') ? '#e53935' : 'inherit' }}>{t.saudiCouncil}</span>
                    <span style={{ color: t.isRed && t.bls.includes('2024') ? '#e53935' : 'inherit' }}>{t.bls}</span>
                    <span style={{ color: t.isRed && t.fireSafety.includes('2024') ? '#e53935' : 'inherit' }}>{t.fireSafety}</span>
                    <span style={{ color: t.isRed && t.infectionControl.includes('2024') ? '#e53935' : 'inherit' }}>{t.infectionControl}</span>
                    <span style={{ color: t.isRed && t.medicationSafety.includes('2024') ? '#e53935' : 'inherit' }}>{t.medicationSafety}</span>
                    <span style={{ color: t.isRed && t.biscl.includes('2024') ? '#e53935' : 'inherit' }}>{t.biscl}</span>
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
            <div className="box-header">
              <h2 className="content-box-title">Training Needs Analysis</h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px" }}>Competency Gaps by Unit</p>
            <div className="heatmap-grid">
              <div className="heatmap-cell" style={{ background: "#e53935" }}>ER <span className="heatmap-label">High Gap</span></div>
              <div className="heatmap-cell" style={{ background: "#ff9800" }}>ICU <span className="heatmap-label">Med Gap</span></div>
              <div className="heatmap-cell" style={{ background: "#4caf50" }}>OR <span className="heatmap-label">Low Gap</span></div>
              <div className="heatmap-cell" style={{ background: "#ff9800" }}>NICU <span className="heatmap-label">Med Gap</span></div>
            </div>
            
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "13px", color: "#4a6a85", marginBottom: "10px" }}>CPD/CME Completion Progress</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                <span>Required: 5000 hrs</span>
                <span>Completed: 3450 hrs</span>
              </div>
              {renderProgressBar((3450/5000)*100)}
            </div>

            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "13px", color: "#4a6a85", marginBottom: "10px" }}>High-Risk Staff Flags</h4>
              <div className="stat-item">
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>New Hires (Missing Basics)</span>
                <span className="badge high-risk" style={{ width: "auto" }}>14</span>
              </div>
              <div className="stat-item">
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Float Staff (Unverified)</span>
                <span className="badge critical" style={{ width: "auto" }}>8</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-row">
          {/* 3. Clinical Competency Assessment Panel */}
          <div className="table-box content-box" style={{ flex: 2 }}>
            <div className="box-header">
              <h2 className="content-box-title">Clinical Competency Assessment</h2>
              <button className="icon-btn-small" title="Filter" onClick={() => alert("Filter functionality would open a modal here")}><Filter size={16} /></button>
            </div>
            <div className="custom-table" style={{ marginTop: '10px' }}>
              <div className="table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr 1.5fr' }}>
                <span>Nurse</span>
                <span>Unit</span>
                <span>Competency</span>
                <span>Status</span>
                <span>Renewal</span>
                <span>Recommendation</span>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {(dashboardData?.clinicalCompetencies || []).map((c) => (
                  <div className="table-row premium-row" key={c.id} style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr 1.5fr', padding: '12px 10px', fontSize: '12px' }}>
                    <span style={{ fontWeight: 500 }}>{c.nurse}</span>
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
            <div className="box-header">
              <h2 className="content-box-title">Learning Outcomes</h2>
            </div>
            <p style={{ fontSize: "12px", color: "#8ea2b5", marginTop: "10px", marginBottom: "15px" }}>Pre vs. Post Test Scores (%)</p>
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trainingEffectiveness} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="course" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
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
              <button className="icon-btn-small" title="Export" onClick={() => window.print()}><Download size={16} /></button>
            </div>
            <div className="custom-table" style={{ marginTop: '10px' }}>
              <div className="table-header" style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr 1fr' }}>
                <span>Cert Name</span>
                <span>Number</span>
                <span>Expiry Date</span>
                <span>Compliance %</span>
                <span>Status</span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {(dashboardData?.certTracker || []).map((c) => (
                  <div className="table-row premium-row" key={c.id} style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr 1fr', padding: '12px 10px', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span>{c.number}</span>
                    <span>{c.expiry}</span>
                    <span>
                      <span style={{ fontWeight: "bold", color: c.compliance > 90 ? "#4caf50" : "#ff9800" }}>{c.compliance}%</span>
                    </span>
                    <span className={`status ${c.uploadStatus === 'Verified' ? 'approved' : c.uploadStatus === 'Expired' ? 'rejected' : 'pending'}`} style={{ fontSize: '11px', padding: '4px 10px', width: 'fit-content', textAlign: 'center' }}>
                      {c.uploadStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Staff Participation & Attendance */}
          <div className="table-box content-box" style={{ flex: 1 }}>
            <div className="box-header">
              <h2 className="content-box-title">Staff Participation & Attendance</h2>
            </div>
            <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
              <div style={{ flex: 1, background: "rgba(242, 157, 145, 0.15)", borderRadius: "8px", padding: "15px", textAlign: "center", border: "1px solid rgba(242, 157, 145, 0.3)" }}>
                <h3 style={{ color: "#e53935", fontSize: "24px", margin: 0 }}>4.2%</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0, marginTop: "5px" }}>Overall No-Show Rate</p>
              </div>
              <div style={{ flex: 1, background: "rgba(76, 175, 80, 0.15)", borderRadius: "8px", padding: "15px", textAlign: "center", border: "1px solid rgba(76, 175, 80, 0.3)" }}>
                <h3 style={{ color: "#4caf50", fontSize: "24px", margin: 0 }}>8.5h</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0, marginTop: "5px" }}>Avg Training Hrs/Staff</p>
              </div>
            </div>
            
            <div style={{ height: "140px", marginTop: "15px" }}>
              <p style={{ fontSize: "12px", color: "#8ea2b5", marginBottom: "5px", textAlign: "center" }}>Absentee Trend by Unit (%)</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={absenteeTrend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="unit" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="rate" fill="#f29d91" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                    <span style={{ fontWeight: 500 }}>{o.name}</span>
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
            </div>
            <div className="tab-container">
              <button className={`tab-btn ${activeProgramTab === "outside" ? "active" : ""}`} onClick={() => setActiveProgramTab("outside")}>Outside Hospital</button>
              <button className={`tab-btn ${activeProgramTab === "inside" ? "active" : ""}`} onClick={() => setActiveProgramTab("inside")}>Inside Hospital</button>
              <button className={`tab-btn ${activeProgramTab === "cross" ? "active" : ""}`} onClick={() => setActiveProgramTab("cross")}>Cross-Training</button>
            </div>
            
            <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: "8px", padding: "15px", minHeight: "150px" }}>
              {activeProgramTab === "outside" && (
                <div>
                  <h4 style={{ fontSize: "14px", color: "#243647", marginBottom: "10px" }}>Recent Outside Programs</h4>
                  <p style={{ fontSize: "13px", color: "#5a738e" }}>• Advanced Trauma Life Support - <i>King Fahad Hospital</i> (3 Days) - $450</p>
                  <p style={{ fontSize: "13px", color: "#5a738e", marginTop: "8px" }}>• Leadership in Nursing - <i>Virtual Seminar</i> (1 Day) - $150</p>
                </div>
              )}
              {activeProgramTab === "inside" && (
                <div>
                  <h4 style={{ fontSize: "14px", color: "#243647", marginBottom: "10px" }}>Internal Workshops</h4>
                  <p style={{ fontSize: "13px", color: "#5a738e" }}>• IV Therapy Recertification - <i>Main Hall A</i> (4 Hours)</p>
                  <p style={{ fontSize: "13px", color: "#5a738e", marginTop: "8px" }}>• New EMR System Training - <i>Lab 3</i> (8 Hours)</p>
                </div>
              )}
              {activeProgramTab === "cross" && (
                <div>
                  <h4 style={{ fontSize: "14px", color: "#243647", marginBottom: "10px" }}>Cross-Training Deployments</h4>
                  <p style={{ fontSize: "13px", color: "#5a738e" }}>• M. Ali: NICU ➔ Pediatric Ward (Starts: 2026-06-01)</p>
                  <p style={{ fontSize: "13px", color: "#5a738e", marginTop: "8px" }}>• S. Khan: MedSurg ➔ ER Triage (Completed)</p>
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
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
            
            {/* Intern Stats */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "rgba(96, 130, 230, 0.1)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, color: "#4a6a85" }}>IAU Interns</span>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#6082e6" }}>45</span>
              </div>
              <div style={{ background: "rgba(156, 181, 241, 0.1)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, color: "#4a6a85" }}>Non-IAU Interns</span>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#9cb5f1" }}>73</span>
              </div>
              <div style={{ background: "rgba(242, 157, 145, 0.1)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, color: "#4a6a85" }}>Summer Training</span>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#f29d91" }}>22</span>
              </div>
            </div>

            {/* Intern Requests Table */}
            <div className="custom-table" style={{ flex: 2 }}>
              <div className="table-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <span>Applicant Name</span>
                <span>University</span>
                <span>Program</span>
                <span>Status</span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {(dashboardData?.internRequests || []).map((req) => (
                  <div className="table-row premium-row" key={req.id} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 15px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 500 }}>{req.name}</span>
                    <span>{req.university}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{req.program}</span>
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
      </div>
    </Layout>
  );
}
