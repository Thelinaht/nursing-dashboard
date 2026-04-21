
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ClipboardList, Activity, Download, Calculator, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend as LineLegend
} from "recharts";
import Layout from "../components/Layout";
// Import supervisor core styles to guarantee layout works!
import "../styles/SupervisorDashboard.css";
// Import our extra specific addons
import "../styles/DirectorDashboard.css";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

// Mock Data for the Skill Mix Pie Chart
const skillMixData = [
  { name: "RNs", value: 335, color: "#6082e6" },
  { name: "LPNs", value: 126, color: "#9cb5f1" },
  { name: "Assistant", value: 70, color: "#e8c35d" },
  { name: "NPs", value: 29, color: "#d29bd1" },
  { name: "Interns", value: 19, color: "#f29d91" }
];

// Mock Data for Nurse Satisfaction Line Chart (Dual lines)
const satisfactionData = [
  { name: "Week 1", "Last Month": 65, "This Month": 70 },
  { name: "Week 2", "Last Month": 59, "This Month": 75 },
  { name: "Week 3", "Last Month": 80, "This Month": 65 },
  { name: "Week 4", "Last Month": 81, "This Month": 58 },
  { name: "Week 5", "Last Month": 56, "This Month": 55 },
  { name: "Week 6", "Last Month": 55, "This Month": 65 },
  { name: "Week 7", "Last Month": 40, "This Month": 85 },
];

const requestStatusData = [
  { status: "Pending", count: 12, color: "#ff9800" },
  { status: "Approved", count: 45, color: "#4caf50" },
  { status: "Under Review", count: 8, color: "#2196f3" },
  { status: "Declined", count: 5, color: "#e53935" }
];

export default function DirectorDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([
    { id: "INC-001", title: "SICU license expiry approaching (3 days)", severity: "critical", time: "2 minutes ago" },
    { id: "INC-002", title: "ER staffing low on Night Shift", severity: "high-risk", time: "15 minutes ago" },
    { id: "INC-003", title: "Training overdue for 14 staff", severity: "high-risk", time: "15 minutes ago" }
  ]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [stats, setStats] = useState({
    required: 1072,
    available: 579,
    shortage: 493,
    percentage: "46%"
  });

  // Calculator State
  const [calcNurses, setCalcNurses] = useState(10);
  const [formulaType, setFormulaType] = useState("telford");
  const [calcResult, setCalcResult] = useState(0);

  const formulas = {
    telford: { label: "Telford Method", divisor: 0, calc: (n) => ((n * 8 * 7) / 48).toFixed(1) },
    exp8h1: { label: "Exp 8h (1 Off)", divisor: 248, calc: (n) => ((n * 365) / 248).toFixed(1) },
    exp8h2: { label: "Exp 8h (2 Off)", divisor: 196, calc: (n) => ((n * 365) / 196).toFixed(1) },
    exp12h3: { label: "Exp 12h (3 Off)", divisor: 144, calc: (n) => ((n * 365) / 144).toFixed(1) },
    saudi8h2: { label: "Saudi 8h (2 Off)", divisor: 205, calc: (n) => ((n * 365) / 205).toFixed(1) },
    saudi12h3: { label: "Saudi 12h (3 Off)", divisor: 153, calc: (n) => ((n * 365) / 153).toFixed(1) },
  };

  useEffect(() => {
    setCalcResult(formulas[formulaType].calc(calcNurses));
  }, [calcNurses, formulaType]);

  useEffect(() => {
    fetchRequests();
    // Keep your hospital's real-time interaction active!
    socket.on("new_incident", (newIncident) => {
      setIncidents((prev) => [newIncident, ...prev].slice(0, 5)); // Keep latest 5
    });
    return () => socket.off("new_incident");
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/requests");
      const data = await res.json();
      // If showAllHistory is true, show everything. Otherwise, show only Pending.
      if (showAllHistory) {
        setRequests(data);
      } else {
        setRequests(data.filter(r => r.current_status === "Pending"));
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [showAllHistory]);

  const handleDecision = async (requestId, decision) => {
    try {
      const res = await fetch("http://localhost:4000/api/approvals/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          decision: decision === "Approve" ? "Approved" : "Rejected"
        })
      });

      if (res.ok) {
        // Refresh requests after decision
        fetchRequests();
        // Here we could also trigger a socket event or toast notification
      }
    } catch (err) {
      console.error("Error submitting decision:", err);
    }
  };

  const generatePDFReport = (title, data, type = "pie") => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Hospital Report: ${title}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = type === "pie"
      ? data.map(item => [item.name, item.value])
      : data.map(item => [item.name, item["Last Month"], item["This Month"]]);

    const tableHeader = type === "pie"
      ? [["Category", "Count"]]
      : [["Week", "Last Month (%)", "This Month (%)"]];

    autoTable(doc, {
      startY: 40,
      head: tableHeader,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [74, 106, 133] }
    });

    doc.save(`hospital_${title.toLowerCase().replace(/ /g, '_')}_report.pdf`);
  };

  return (
    <Layout role="director" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Director"}>
      <div className="main">
        <div className="supervisor-container">

          {/* Navigation Controls */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="icon-btn-small" onClick={() => navigate(-1)} title="Back">
              <ArrowLeft size={18} />
            </button>
            <button className="icon-btn-small" onClick={() => navigate(1)} title="Forward">
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Top Stats Cards (Inheriting from Supervisor theme directly!) */}
          <div className="cards-row">
            <div className="wave-card glass-card">
              <p><i><Users size={16} color="white" /></i> Required Nurses</p>
              <h1>{stats.required}</h1>
            </div>

            <div className="wave-card glass-card">
              <p><i><ClipboardList size={16} color="white" /></i> Available Nurses</p>
              <h1>{stats.available}</h1>
            </div>

            <div className="wave-card glass-card danger-text">
              <p><i><Activity size={16} color="white" /></i> Shortage ({stats.percentage})</p>
              <h1>{stats.shortage}</h1>
            </div>
          </div>

          {/* Middle Section: Skill Mix + Request Status */}
          <div className="middle-section">
            {/* Skill Mix */}
            <div className="table-box content-box">
              <div className="box-header">
                <h2 className="content-box-title">Skill-Mix Distribution</h2>
                <button
                  className="icon-btn-small"
                  title="Download PDF"
                  onClick={() => generatePDFReport("Skill-Mix Distribution", skillMixData, "pie")}
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="chart-trans-container" style={{ height: "300px", backgroundColor: 'transparent' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillMixData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {skillMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <PieTooltip />
                    <PieLegend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      formatter={(value, entry) => (
                        <span style={{ color: '#333', fontSize: '11px' }}>
                          {value} <span style={{ color: '#888' }}>({entry.payload.value})</span>
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Staffing Requirement Calculator */}
            <div className="table-box content-box">
              <div className="box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calculator size={18} color="var(--accent-blue)" />
                  <h2 className="content-box-title">Staffing Requirement Calculator</h2>
                </div>
              </div>
              <div style={{ padding: '15px 5px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div className="input-group">
                  <label style={{ fontSize: '13px', color: '#5a738e', marginBottom: '8px', display: 'block' }}>Nurses Needed in 24H (Sum of 3 shifts)</label>
                  <input
                    type="number"
                    value={calcNurses}
                    onChange={(e) => setCalcNurses(Number(e.target.value))}
                    className="input-pill"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Calculation Formula / Method</label>
                  <select
                    value={formulaType}
                    onChange={(e) => setFormulaType(e.target.value)}
                    className="input-pill"
                    style={{ width: '100%' }}
                  >
                    {Object.entries(formulas).map(([key, f]) => (
                      <option key={key} value={key}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="calc-result-area">
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#4a6070' }}>Total Staff Required:</span>
                  <div style={{ marginTop: '5px', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 700, color: '#4a6a85' }}>{calcResult}</span>
                    <span style={{ fontSize: '14px', color: '#8ea2b5' }}>Nurses</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#888', marginTop: '10px', fontStyle: 'italic' }}>
                    *Based on hospital standard actual working days and leave policy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="middle-section">

            {/* Incidents Component */}
            <div className="table-box content-box">
              <div className="box-header">
                <h2 className="content-box-title">Recent Incidents</h2>
                <div className="actions"><span className="view-all">View All</span></div>
              </div>
              <div className="incidents-list">
                {incidents.map((inc) => (
                  <div className="incident-card" key={inc.id}>
                    <div className="incident-top">
                      <span style={{ color: '#888' }}>{inc.id}</span>
                      {/* We use Supervisor badge classes! */}
                      <span className={`badge ${inc.severity}`} style={{ margin: 0, fontSize: "10px", width: "auto", padding: "3px 10px" }}>{inc.severity === "critical" ? "Critical" : "High"}</span>
                    </div>
                    <div className="incident-title">
                      {inc.title}
                      <span className="incident-time">{inc.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Satisfaction Component */}
            <div className="table-box content-box">
              <div className="box-header">
                <h2 className="content-box-title">Nurse Satisfaction</h2>
                <button
                  className="icon-btn-small"
                  title="Download PDF"
                  onClick={() => generatePDFReport("Nurse Satisfaction", satisfactionData, "line")}
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="chart-container-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                    <XAxis dataKey="name" hide={true} />
                    <YAxis hide={true} domain={[0, 100]} />
                    <LineTooltip />
                    <LineLegend iconType="circle" wrapperStyle={{ fontSize: '0.9rem', bottom: -5 }} />
                    <Line type="monotone" dataKey="Last Month" stroke="#4caf50" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="This Month" stroke="#e53935" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Grid: Manage Requests (Interactive Feature) */}
          <div className="middle-section" style={{ marginTop: '20px' }}>
            <div className="table-box content-box" style={{ flex: 1 }}>
              <div className="box-header">
                <h2 className="content-box-title">{showAllHistory ? "All Requests History" : "Pending Requests Management"}</h2>
                <button
                  className="btn-pill"
                  style={{ background: 'var(--accent-blue)', color: 'white', gap: '5px' }}
                  onClick={() => setShowAllHistory(!showAllHistory)}
                >
                  <FileText size={14} />
                  {showAllHistory ? "Show Pending Only" : "View All History"}
                </button>
              </div>
              <div className="custom-table" style={{ marginTop: '10px' }}>
                <div className="table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 1.5fr' }}>
                  <span>Staff Name</span>
                  <span>Request Type</span>
                  <span>Submitted On</span>
                  <span>{showAllHistory ? "Status / Actions" : "Actions"}</span>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {requests.length > 0 ? requests.map((req) => (
                    <div className="table-row premium-row" key={req.request_id} style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 1.5fr', padding: '12px 15px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{req.full_name || `Nurse #${req.nurse_id}`}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{req.request_type}</span>
                      <span style={{ fontSize: '11px' }}>{new Date(req.submission_date).toLocaleDateString()}</span>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {req.current_status === "Pending" ? (
                          <>
                            <button
                              className="btn-pill"
                              style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
                              onClick={() => handleDecision(req.request_id, "Approve")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-pill"
                              style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}
                              onClick={() => handleDecision(req.request_id, "Deny")}
                            >
                              Deny
                            </button>
                          </>
                        ) : (
                          <span className={`status ${req.current_status?.toLowerCase().replace(" ", "-")}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                            {req.current_status}
                          </span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8ea2b5' }}>
                      {loading ? "Loading requests..." : "No requests found."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );

}
