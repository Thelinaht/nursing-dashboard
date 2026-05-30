import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ClipboardList, Activity, Download, Calculator, FileText, TrendingUp, AlertTriangle, AlertCircle, CheckCircle, X, Info, ChevronRight, FileDown } from "lucide-react";
import RequestsTable from "../components/RequestsTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend as LineLegend,
  BarChart, Bar, Tooltip as BarTooltip
} from "recharts";
import Layout from "../components/Layout";
// Import supervisor core styles to guarantee layout works!
import "../styles/SupervisorDashboard.css";
// Import our extra specific addons
import "../styles/DirectorDashboard.css";
import "../styles/ResearcherDashboard.css";
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
  const [incidents, setIncidents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [inpatientStaffing, setInpatientStaffing] = useState([]);
  const [staffingFilter, setStaffingFilter] = useState('All');
  const [staffingPage, setStaffingPage] = useState(1);

  // Research Chart states
  const [projects, setProjects] = useState([]);
  const [publications, setPublications] = useState([]);
  const [researchLoading, setResearchLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportYear, setReportYear] = useState("all");

  const filteredStaffing = inpatientStaffing.filter(row => {
    if (staffingFilter === 'All') return true;
    if (staffingFilter === 'ICU') return row.unit_name.includes('ICU') || row.unit_name === 'CCU' || row.unit_name === 'HDU';
    if (staffingFilter === 'Pediatric') return row.unit_name.includes('Pediatric') || row.unit_name.includes('PICU') || row.unit_name.includes('NICU');
    if (staffingFilter === 'Medical') return row.unit_name.includes('Medical') && !row.unit_name.includes('ICU');
    if (staffingFilter === 'Surgical') return row.unit_name.includes('Surgical');
    if (staffingFilter === 'OB/GYN') return row.unit_name.includes('Labor') || row.unit_name.includes('Postpartum');
    if (staffingFilter === 'Psychiatry') return row.unit_name.includes('Psychiatry');
    return true;
  });

  const staffingRowsPerPage = 10;
  const totalStaffingPages = Math.ceil(filteredStaffing.length / staffingRowsPerPage);
  const currentStaffingPageRows = filteredStaffing.slice((staffingPage - 1) * staffingRowsPerPage, staffingPage * staffingRowsPerPage);

  const exportStaffingToExcel = () => {
    const csvRows = [];
    csvRows.push(['Unit Name', 'Bed Census', 'Required Ratio', 'Available Nurses', 'Total Needed', 'Gap', 'Status'].join(','));
    filteredStaffing.forEach(row => {
      csvRows.push([
        `"${row.unit_name}"`,
        row.bed_census,
        `"${row.required_ratio}"`,
        row.available_nurses,
        row.total_needed,
        row.gap,
        `"${row.status}"`
      ].join(','));
    });

    // Add BOM for Excel UTF-8 compatibility
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Inpatient_Staffing.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const [ambulatoryStaffing, setAmbulatoryStaffing] = useState([]);
  const [ambulatoryFilter, setAmbulatoryFilter] = useState('All');
  const [ambulatoryPage, setAmbulatoryPage] = useState(1);

  // Ratio Log state (shared with Supervisor — Director sees live updates)
  const [ratioLogs, setRatioLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('Today');
  const [editingUnit, setEditingUnit] = useState(null);      // unit name being edited
  const [editRatioValue, setEditRatioValue] = useState('');  // draft value
  const [editSaving, setEditSaving] = useState(false);

  const fetchRatioLogs = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/dashboard/ratio-logs?filter=${logFilter}`);
      const data = await res.json();
      setRatioLogs(data);
    } catch (err) {
      console.error("Error fetching ratio logs:", err);
    }
  };

  const saveRequiredRatio = async (unit) => {
    if (!editRatioValue.trim()) return;
    setEditSaving(true);
    try {
      await fetch('http://localhost:4000/api/dashboard/required-ratio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit, required_ratio: editRatioValue.trim() })
      });
      setEditingUnit(null);
      fetchRatioLogs(); // re-fetch so updated required ratio shows immediately
    } catch (err) {
      console.error('Error saving required ratio:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const dismissIncident = (id) => {
    setIncidents(incidents.filter(inc => inc.id !== id));
  };

  const clearAllIncidents = () => {
    setIncidents([]);
  };

  const [stats, setStats] = useState({
    required: 1072,
    available: 579,
    shortage: 493,
    percentage: "46%"
  });

  const [kpis, setKpis] = useState({
    total_nursing_staff: 0,
    new_orientees: 0,
    expiring_licenses: 0,
    expired_certs: 0,
    training_compliance: 0
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

  // Derived research calculations
  const utilizationData = (() => {
    const yearMap = {};
    projects.forEach(p => {
      if (!p.start_date) return;
      const year = new Date(p.start_date).getFullYear();
      if (!yearMap[year]) yearMap[year] = { year: String(year), projects: 0, publications: 0 };
      yearMap[year].projects += 1;
    });
    publications.forEach(p => {
      if (!p.date) return;
      if (p.type !== "Published") return;
      const year = new Date(p.date).getFullYear();
      if (!yearMap[year]) yearMap[year] = { year: String(year), projects: 0, publications: 0 };
      yearMap[year].publications += 1;
    });
    return Object.values(yearMap).sort((a, b) => a.year.localeCompare(b.year));
  })();

  const availableYears = [...new Set([
    ...projects.filter(p => p.start_date).map(p => new Date(p.start_date).getFullYear()),
    ...publications.filter(p => p.date).map(p => new Date(p.date).getFullYear())
  ])].sort((a, b) => b - a);

  useEffect(() => {
    fetchRequests();
    fetchKpis();
    fetchStaffList();
    fetchInpatientStaffing();
    fetchAmbulatoryStaffing();
    fetchResearchData();
    fetchRatioLogs();
    // Keep your hospital's real-time interaction active!
    socket.on("new_incident", (newIncident) => {
      setIncidents((prev) => [newIncident, ...prev].slice(0, 5)); // Keep latest 5
    });
    socket.on("request_updated", fetchRequests);
    // Real-time: re-fetch ratio logs whenever a supervisor logs a new ratio
    socket.on("ratio_log_updated", fetchRatioLogs);
    return () => {
      socket.off("new_incident");
      socket.off("request_updated");
      socket.off("ratio_log_updated");
    };
  }, []);

  // Re-fetch ratio logs when the filter changes
  useEffect(() => {
    fetchRatioLogs();
  }, [logFilter]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/requests");
      const data = await res.json();
      // If showAllHistory is true, show everything. Otherwise, show only Pending.
      if (showAllHistory) {
        setRequests(data);
      } else {
        setRequests(data.filter(r => r.current_status === "Pending_Director"));
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setLoading(false);
    }
  };

  const fetchKpis = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/dashboard/director-kpis");
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      console.error("Error fetching KPIs:", err);
    }
  };

  const fetchInpatientStaffing = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/dashboard/inpatient-staffing");
      const data = await res.json();
      setInpatientStaffing(data);
    } catch (err) {
      console.error("Error fetching inpatient staffing:", err);
    }
  };

  const fetchAmbulatoryStaffing = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/dashboard/ambulatory-staffing");
      const data = await res.json();
      setAmbulatoryStaffing(data);
    } catch (err) {
      console.error("Error fetching ambulatory staffing:", err);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/nurses");
      const data = await res.json();
      setStaffList(data.slice(0, 5)); // Show partial list of 5 rows
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  const fetchResearchData = async () => {
    setResearchLoading(true);
    try {
      const [projectsRes, pubsRes] = await Promise.all([
        fetch("http://localhost:4000/api/research/projects"),
        fetch("http://localhost:4000/api/research/publications")
      ]);
      if (projectsRes.ok && pubsRes.ok) {
        setProjects(await projectsRes.json());
        setPublications(await pubsRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch research data", err);
    } finally {
      setResearchLoading(false);
    }
  };

  const generateResearchReport = () => {
    const yearFilter = reportYear === "all" ? null : parseInt(reportYear, 10);

    const filteredProjects = projects.filter(p => {
      if (!yearFilter) return true;
      if (!p.start_date) return false;
      return new Date(p.start_date).getFullYear() === yearFilter;
    });
    const filteredPubs = publications.filter(p => {
      if (!yearFilter) return true;
      if (!p.date) return false;
      return new Date(p.date).getFullYear() === yearFilter;
    });

    const activeProjs = filteredProjects.filter(p => p.status === "Active");
    const completedProjs = filteredProjects.filter(p => p.status === "Completed");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 20;

    // ── Report Header ──
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Research Report", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const filterText = yearFilter ? `Year: ${yearFilter}` : "All Years";
    doc.text(`${filterText}  |  Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth / 2, y, { align: "center" });
    y += 8;

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";

    const addSectionTable = (label, head, rows) => {
      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`${label} (${rows.length})`, margin, y);
      y += 5;

      if (rows.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150);
        doc.text("No entries.", margin + 2, y + 4);
        y += 12;
        return;
      }

      autoTable(doc, {
        startY: y,
        head: [head],
        body: rows,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [71, 85, 105],
          lineColor: [203, 213, 225],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didDrawPage: (data) => {
          y = data.cursor.y + 8;
        }
      });
      y = doc.lastAutoTable.finalY + 10;
    };

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Research Projects", margin, y);
    y += 8;

    const projectColumns = ["#", "Title", "Investigator", "Start Date", "Status"];
    const buildProjectRows = (list) => list.map((p, i) => [
      String(i + 1),
      p.title || "—",
      p.investigator_name || "—",
      formatDate(p.start_date),
      p.status || "—"
    ]);

    addSectionTable("Active", projectColumns, buildProjectRows(activeProjs));
    addSectionTable("Completed", projectColumns, buildProjectRows(completedProjs));

    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Publications", margin, y);
    y += 8;

    const pubColumns = ["#", "Title", "Author", "Type", "Date", "Journal / Conference", "File"];
    const pubRows = filteredPubs.map((p, i) => [
      String(i + 1),
      p.title || "—",
      p.author_name || "—",
      p.type || "—",
      formatDate(p.date),
      p.journal_name || "—",
      p.PublishedFile_path ? "View PDF" : "—"
    ]);

    if (pubRows.length === 0) {
      addSectionTable("All Publications", pubColumns, pubRows);
    } else {
      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`All Publications (${pubRows.length})`, margin, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [pubColumns],
        body: pubRows,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [71, 85, 105],
          lineColor: [203, 213, 225],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          6: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'center' }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const pub = filteredPubs[data.row.index];
            if (pub && pub.PublishedFile_path) {
              const url = `http://localhost:4000/uploads/${pub.PublishedFile_path}`;
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
            }
          }
        }
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    const suffix = yearFilter || "all-years";
    doc.save(`research-report-${suffix}-${Date.now()}.pdf`);
    setShowReportModal(false);
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

          {/* Top KPI Grid */}
          <div className="rd-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '25px', width: '100%' }}>

            {/* Card 1: Staffing Overview Card */}
            <div className="glass-card blue" style={{ flex: 1, minWidth: '260px', padding: '20px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '145px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A5F', fontWeight: 700 }}><Activity size={16} /> Staffing Overview</p>
              <div className="rd-kpi-split" style={{ display: 'flex', gap: '10px', alignItems: 'stretch', width: '100%', flex: 1 }}>
                <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ color: '#1E3A5F', fontSize: '26px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{stats.required}</h2>
                  <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>Required Nurses</div>
                </div>
                <div className="rd-kpi-split-divider" style={{ background: 'rgba(74, 106, 133, 0.15)', width: '1px' }} />
                <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ color: 'var(--accent-green)', fontSize: '26px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{stats.available}</h2>
                  <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>Available Nurses</div>
                </div>
                <div className="rd-kpi-split-divider" style={{ background: 'rgba(74, 106, 133, 0.15)', width: '1px' }} />
                <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ color: 'var(--accent-red)', fontSize: '26px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{stats.shortage}</h2>
                  <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>Shortage ({stats.percentage})</div>
                </div>
              </div>
            </div>

            {/* Card 2: Nursing Staff Card */}
            <div className="glass-card blue" style={{ flex: 1, minWidth: '260px', padding: '20px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '145px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A5F', fontWeight: 700 }}><Users size={16} /> Nursing Staff</p>
              <div className="rd-kpi-split" style={{ display: 'flex', gap: '10px', alignItems: 'stretch', width: '100%', flex: 1 }}>
                <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ color: '#1E3A5F', fontSize: '26px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{kpis.total_nursing_staff}</h2>
                  <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>Total Staff</div>
                </div>
                <div className="rd-kpi-split-divider" style={{ background: 'rgba(74, 106, 133, 0.15)', width: '1px' }} />
                <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ color: '#1E3A5F', fontSize: '26px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{kpis.new_orientees}</h2>
                  <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>New Orientees</div>
                </div>
              </div>
            </div>

            {/* Card 3: Compliance Issues Card */}
            <div className="glass-card red" style={{ flex: 1, minWidth: '260px', padding: '20px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '145px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: 700 }}><AlertCircle size={16} /> Compliance Issues</p>
              <div className="rd-kpi-split" style={{ display: 'flex', gap: '10px', alignItems: 'stretch', width: '100%', flex: 1 }}>
                <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ color: 'var(--accent-red)', fontSize: '26px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{kpis.expired_certs}</h2>
                  <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>Expired Certs</div>
                </div>
                <div className="rd-kpi-split-divider" style={{ background: 'rgba(220, 38, 38, 0.15)', width: '1px' }} />
                <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ color: 'var(--accent-orange)', fontSize: '26px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{kpis.expiring_licenses}</h2>
                  <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>Licenses Expir. (30d)</div>
                </div>
              </div>
            </div>

            {/* Card 4: Training Compliance Card */}
            <div className={`glass-card ${
              Number(kpis.training_compliance) >= 80 ? 'green' :
              Number(kpis.training_compliance) >= 50 ? 'yellow' : 'red'
            }`} style={{ flex: 1, minWidth: '260px', padding: '20px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '145px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><CheckCircle size={16} /> Training Compliance</p>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, width: '100%' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 800, margin: 0, textAlign: 'center', lineHeight: 1.1 }}>
                  {kpis.training_compliance}%
                </h1>
                <div className="rd-kpi-split-label" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>Compliance Rate</div>
              </div>
            </div>

          </div>

          {/* Quick Actions */}
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '700', marginTop: '25px' }}>Quick Actions</h3>
          <div className="cards-row" style={{ marginBottom: '25px' }}>
            <div className="glass-card blue clickable-card"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', height: '180px', position: 'relative', flex: 1 }}
              onClick={() => navigate('/inpatient-staffing')}>
              <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '22px', position: 'relative', zIndex: 2 }}>Inpatient Staffing</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '320px', position: 'relative', zIndex: 2 }}>Manage daily inpatient staff census, ratios, and gaps.</p>
              <ChevronRight style={{ position: 'absolute', right: '20px', color: 'var(--text-muted)', zIndex: 2 }} size={24} />
            </div>

            <div className="glass-card blue clickable-card"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', height: '180px', position: 'relative', flex: 1 }}
              onClick={() => navigate('/ambulatory-staffing')}>
              <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '22px', position: 'relative', zIndex: 2 }}>Ambulatory Staffing</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '320px', position: 'relative', zIndex: 2 }}>Manage daily ambulatory staff census, ratios, and gaps.</p>
              <ChevronRight style={{ position: 'absolute', right: '20px', color: 'var(--text-muted)', zIndex: 2 }} size={24} />
            </div>
          </div>



          {/* Duplicated Research Card */}
          <div className="rd-card" style={{ marginBottom: '20px', width: '100%' }}>
            <div className="rd-card-header">
              <p className="rd-card-title">Research Projects vs. Publications by Year</p>
              <button onClick={() => { setReportYear("all"); setShowReportModal(true); }} className="rd-primary-btn">
                <FileDown size={16} /> Generate Report
              </button>
            </div>
            <p className="rd-chart-subtitle">
              Comparing the total number of research projects started (Active + Completed) against the publications produced each year.
            </p>
            <div className="rd-legend-row">
              <span className="rd-legend-item">
                <span className="rd-legend-dot" style={{ background: "#5a6f87" }} />
                Research Projects
              </span>
              <span className="rd-legend-item">
                <span className="rd-legend-dot" style={{ background: "#9fb3cc" }} />
                Publications
              </span>
            </div>
            <div className="rd-chart-box">
              {researchLoading ? (
                <div className="rd-chart-empty">Loading research data...</div>
              ) : utilizationData.length === 0 ? (
                <div className="rd-chart-empty">
                  No data to display yet. Add research projects or publications to see the chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} allowDecimals={false} />
                    <BarTooltip
                      cursor={{ fill: 'rgba(90,111,135,0.05)' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', background: '#2f3e55', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                      labelStyle={{ color: 'white' }}
                      itemStyle={{ color: 'rgba(255,255,255,0.85)' }}
                    />
                    <Bar dataKey="projects" fill="#5a6f87" radius={[4, 4, 0, 0]} barSize={30} name="Research Projects" />
                    <Bar dataKey="publications" fill="#9fb3cc" radius={[4, 4, 0, 0]} barSize={30} name="Publications" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ======== Nurse-to-Patient Ratios by Unit (Live from Supervisor Logs) ======== */}
          {(() => {
            // Derive latest log per unit from the fetched ratioLogs
            const latestByUnit = {};
            ratioLogs.forEach(row => {
              if (!latestByUnit[row.unit_name]) {
                latestByUnit[row.unit_name] = row; // already sorted DESC by timestamp
              }
            });
            const unitRatios = Object.values(latestByUnit).map(row => {
              const isBreached = row.status === 'Breached';
              const isBorderline = row.status === 'Borderline';
              const barValue = isBreached ? 100 : isBorderline ? 65 : 40;
              return {
                unit: row.unit_name,
                loggedRatio: row.logged_ratio,
                requiredRatio: row.required_ratio || 'N/A',
                shift: row.shift,
                status: isBreached ? 'exceeds' : isBorderline ? 'borderline' : 'normal',
                label: isBreached ? 'Exceeds' : isBorderline ? 'Borderline' : 'Normal',
                barColor: isBreached ? '#ef4444' : isBorderline ? '#f59e0b' : '#22c55e',
                barValue,
                loggedBy: row.logged_by_name || 'System',
                time: row.timestamp ? new Date(row.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'
              };
            });

            if (unitRatios.length === 0) return null;

            return (
              <div className="table-box content-box" style={{ marginTop: '20px', width: '100%' }}>
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 className="content-box-title">Nurse-to-Patient Ratios by Unit</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Live status from supervisor logs — updates instantly when a supervisor submits a new ratio.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {['Today', 'This Week', 'All'].map(f => (
                      <button
                        key={f}
                        onClick={() => setLogFilter(f)}
                        style={{
                          padding: '4px 12px', fontSize: '11px', borderRadius: '20px', border: 'none',
                          cursor: 'pointer',
                          backgroundColor: logFilter === f ? 'var(--accent-blue)' : '#f1f5f9',
                          color: logFilter === f ? 'white' : '#64748b',
                          fontWeight: logFilter === f ? 600 : 500
                        }}
                      >{f}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {unitRatios.map((r, i) => (
                    <div key={i} style={{
                      background: r.status === 'exceeds' ? '#fff5f5' : r.status === 'borderline' ? '#fffbeb' : '#f0fdf4',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      border: `1px solid ${r.status === 'exceeds' ? '#fecaca' : r.status === 'borderline' ? '#fde68a' : '#bbf7d0'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{r.unit}</span>

                          {/* Inline edit for required ratio */}
                          {editingUnit === r.unit ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>Required:</span>
                              <input
                                autoFocus
                                value={editRatioValue}
                                onChange={e => setEditRatioValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveRequiredRatio(r.unit); if (e.key === 'Escape') setEditingUnit(null); }}
                                placeholder="e.g. 1:4"
                                style={{ width: '70px', padding: '3px 8px', borderRadius: '6px', border: '1.5px solid var(--accent-blue)', fontSize: '13px', fontWeight: 600 }}
                              />
                              <button
                                onClick={() => saveRequiredRatio(r.unit)}
                                disabled={editSaving}
                                style={{ padding: '3px 10px', borderRadius: '6px', background: 'var(--accent-blue)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >{editSaving ? '…' : 'Save'}</button>
                              <button
                                onClick={() => setEditingUnit(null)}
                                style={{ padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                              >Cancel</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              Logged: {r.loggedRatio} &nbsp;|&nbsp; Required: <strong>{r.requiredRatio}</strong> &nbsp;|&nbsp; {r.shift} shift
                              <button
                                title="Edit required ratio"
                                onClick={() => { setEditingUnit(r.unit); setEditRatioValue(r.requiredRatio === 'N/A' ? '' : r.requiredRatio); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', lineHeight: 1, color: '#94a3b8', display: 'inline-flex', alignItems: 'center' }}
                              >
                                ✏️
                              </button>
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>by {r.loggedBy} · {r.time}</span>
                          <span style={{
                            fontWeight: 700, fontSize: '13px',
                            color: r.status === 'exceeds' ? '#dc2626' : r.status === 'borderline' ? '#d97706' : '#16a34a'
                          }}>{r.label}</span>
                        </div>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${r.barValue}%`, height: '100%', background: r.barColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Bottom Grid: Manage Requests and Staff Directory */}
          <div className="middle-section" style={{ marginTop: '20px' }}>
            {/* Manage Requests */}
            <div className="table-box content-box" style={{ flex: 1 }}>
              <RequestsTable
                requests={requests}
                pendingStatus="Pending_Director"
                apiEndpoint="/api/approvals/director"
                modalTitle="Director Final Decision"
                onRefresh={fetchRequests}
                showHistory={showAllHistory}
                onToggleHistory={() => setShowAllHistory(h => !h)}
              />
            </div>

            {/* Staff Directory Preview */}
            <div className="table-box content-box" style={{ flex: 1 }}>
              <div className="box-header">
                <h2 className="content-box-title">Staff Directory Overview</h2>
                <button
                  className="btn-pill"
                  style={{ background: 'var(--accent-blue)', color: 'white', gap: '5px' }}
                  onClick={() => navigate('/staff')}
                >
                  <Users size={14} />
                  View Full Directory
                </button>
              </div>
              <div className="custom-table" style={{ marginTop: '10px' }}>
                <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
                  <span>Name</span>
                  <span>Unit</span>
                  <span>Role</span>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {staffList.length > 0 ? staffList.map((staff) => (
                    <div className="table-row premium-row" key={staff.nurse_id} style={{ gridTemplateColumns: '1.5fr 1fr 1fr', padding: '12px 15px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{staff.full_name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{staff.unit}</span>
                      <span className="badge" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', margin: 0, padding: '4px 10px', fontSize: '11px', width: 'max-content' }}>
                        {staff.job_title}
                      </span>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8ea2b5' }}>
                      Loading staff...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Staffing Calculator & Nurse Satisfaction */}
          <div className="middle-section" style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

            {/* Staffing Requirement Calculator */}
            <div className="table-box content-box" style={{ flex: 1, minWidth: '300px' }}>
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
                  <div style={{ marginTop: '5px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '48px', fontWeight: 800, color: '#1E3A5F' }}>{calcResult}</span>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Nurses</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#888', marginTop: '10px', fontStyle: 'italic' }}>
                    *Based on hospital standard actual working days and leave policy.
                  </p>
                </div>
              </div>
            </div>

            {/* Satisfaction Component */}
            <div className="table-box content-box" style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
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
              <div className="chart-container-inner" style={{ flex: 1, minHeight: '240px', marginTop: '15px' }}>
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

        </div>
      </div>

      {/* ===================== REPORT MODAL ===================== */}
      {showReportModal && (
        <div onClick={() => setShowReportModal(false)} className="rd-overlay">
          <div onClick={(e) => e.stopPropagation()} className="rd-modal-box">
            <div className="rd-modal-header">
              <h2 className="rd-modal-title">Generate Research Report</h2>
              <button onClick={() => setShowReportModal(false)} className="rd-close-btn"><X size={22} /></button>
            </div>

            <div className="rd-fields-col">
              <div>
                <label className="rd-label">Filter by Year</label>
                <select value={reportYear} onChange={(e) => setReportYear(e.target.value)} className="rd-input">
                  <option value="all">All Years</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <p className="rd-modal-note">
                The PDF report will include all <strong>Research Projects</strong> (Active &amp; Completed) and <strong>Publications</strong> titles for the selected period.
              </p>

              <div className="rd-actions-row">
                <button onClick={() => setShowReportModal(false)} className="rd-cancel-btn">Cancel</button>
                <button onClick={generateResearchReport} className="rd-save-btn">
                  <FileDown size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );

}