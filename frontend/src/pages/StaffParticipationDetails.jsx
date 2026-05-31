import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, Search, RefreshCw, BarChart2, BookOpen, Filter, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/Layout";
import "../styles/DirectorDashboard.css";
import "../styles/TrainingDirectorDashboard.css";

export default function StaffParticipationDetails() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState("BLS");
    
    // Search and Category filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All"); // "All" | "In-Patient" | "Out-Patient"
    const [hideZeroRates, setHideZeroRates] = useState(false);

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

    const user = JSON.parse(sessionStorage.getItem("user")) || {};

    if (loading) {
        return (
            <Layout role="trainingDirector" username={user.full_name || "Training Director"}>
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Loader className="spin" size={40} color="var(--accent-blue)" />
                    <p style={{ marginTop: "15px", color: "var(--text-secondary)" }}>Loading Participation Data...</p>
                </div>
            </Layout>
        );
    }

    // Extract courses and active stats
    const programs = dashboardData?.programs || [];
    const courseNames = [...new Set(programs.map(p => p.training_name))].filter(Boolean).sort();
    const activeCourse = selectedCourse || courseNames[0] || "BLS";
    
    const stats = dashboardData?.participationStats?.[activeCourse] || {
        overallNoShowRate: 0,
        avgHrsPerStaff: 0,
        unitData: []
    };

    // We can also lookup categories of units from the hospitalUnits list if needed.
    // Let's build a map from hospitalUnits (or hardcoded map) to categories
    const unitCategoryMap = {};
    if (dashboardData?.hospitalUnits) {
        // Wait, dashboardData.hospitalUnits is currently an array of strings in getDashboardData.
        // Let's default category mapping for known units or check matching.
    }

    // Filtered unit data for presentation
    const filteredUnitData = (stats.unitData || [])
        .filter(d => {
            const matchesSearch = d.unit.toLowerCase().includes(searchQuery.toLowerCase());
            // Map category dynamically or assume In-Patient / Out-Patient
            const lowerUnit = d.unit.toLowerCase();
            const isInPatient = !lowerUnit.includes("er") && !lowerUnit.includes("opd") && !lowerUnit.includes("or") && 
                                !lowerUnit.includes("recovery") && !lowerUnit.includes("surgery") && !lowerUnit.includes("dialysis") &&
                                !lowerUnit.includes("famco") && !lowerUnit.includes("endoscopy");
            const category = isInPatient ? "In-Patient" : "Out-Patient";

            const matchesCategory = selectedCategory === "All" || category === selectedCategory;
            const matchesZeroFilter = !hideZeroRates || d.rate > 0;
            return matchesSearch && matchesCategory && matchesZeroFilter;
        });

    const generatePDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(36, 54, 71); // #243647
        doc.text("KFHU Staff Participation & Attendance Report", 14, 22);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | Selected Course: ${activeCourse}`, 14, 28);
        
        // Summary KPIs
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.setFont("helvetica", "bold");
        doc.text("Course Attendance Statistics:", 14, 38);
        
        doc.setFont("helvetica", "normal");
        doc.text(`• Overall No-Show Rate: ${stats.overallNoShowRate}%`, 16, 44);
        doc.text(`• Average Training Hours/Staff: ${stats.avgHrsPerStaff} hrs`, 16, 50);
        doc.text(`• Total Units Tracked: ${stats.unitData?.length || 0}`, 16, 56);
        
        // Participation Table
        const tableData = filteredUnitData.map(d => {
            const lowerUnit = d.unit.toLowerCase();
            const isInPatient = !lowerUnit.includes("er") && !lowerUnit.includes("opd") && !lowerUnit.includes("or") && 
                                !lowerUnit.includes("recovery") && !lowerUnit.includes("surgery") && !lowerUnit.includes("dialysis") &&
                                !lowerUnit.includes("famco") && !lowerUnit.includes("endoscopy");
            const category = isInPatient ? "In-Patient" : "Out-Patient";

            let complianceStatus = "Optimal";
            if (d.rate > 30) {
                complianceStatus = "Needs Attention";
            } else if (d.rate > 10) {
                complianceStatus = "Satisfactory";
            }
            
            return [
                d.unit,
                category,
                `${d.rate.toFixed(1)}%`,
                complianceStatus
            ];
        });

        autoTable(doc, {
            startY: 65,
            head: [["Hospital Unit Name", "Category", "Absentee / No-Show Rate", "Compliance Status"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [36, 54, 71], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: 'bold' },
                2: { fontStyle: 'bold' }
            }
        });

        doc.save(`kfhu_attendance_report_${activeCourse.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Layout role="trainingDirector" username={user.full_name || "Training Director"}>
            <style>{`
                @media screen {
                    .print-only-chart-header {
                        display: none !important;
                    }
                }
                @media print {
                    /* Hide EVERYTHING in the DOM */
                    body * {
                        visibility: hidden !important;
                    }

                    /* Make only the chart-card and its descendants visible */
                    .chart-card, .chart-card * {
                        visibility: visible !important;
                    }

                    /* Position the chart-card at the top-left of the page */
                    .chart-card {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Hide interactive controls on print */
                    .no-print, .no-print * {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /* Show print header inside chart card */
                    .print-only-chart-header {
                        display: block !important;
                        visibility: visible !important;
                        border-bottom: 2px solid #243647 !important;
                        padding-bottom: 10px !important;
                        margin-bottom: 20px !important;
                    }

                    .print-only-chart-header * {
                        visibility: visible !important;
                    }

                    /* Reset layouts for full print page flow */
                    html, body, #root, div[style*="display: flex"], div[style*="flex: 1"], div[style*="overflow: hidden"], div[style*="overflowY: auto"] {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }

                    /* Expand scrollable container to its full height so all units print without scrollbar */
                    .chart-scroll-container {
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                        padding-right: 0 !important;
                    }

                    /* Ensure exact colors print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Recharts bar fill must be exact */
                    .recharts-rectangle {
                        fill: #f29d91 !important;
                    }

                    text {
                        fill: #000 !important;
                        font-family: sans-serif !important;
                        font-size: 11px !important;
                        font-weight: 600 !important;
                    }
                }
            `}</style>
            
            <div className="main" style={{ maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "20px" }}>
                
                {/* Header Row */}
                <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button 
                            className="back-btn" 
                            onClick={() => navigate("/training-director-dashboard")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, padding: "8px 16px" }}
                        >
                            <ArrowLeft size={14} /> Back to Dashboard
                        </button>
                        <button 
                            onClick={fetchData} 
                            className="icon-btn-small" 
                            style={{ padding: "8px 12px", border: "1px solid #dde3ea", display: "flex", alignItems: "center", gap: "6px" }}
                            title="Refresh Data"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                            Staff Participation &amp; Attendance Details
                        </h1>
                    </div>
                </div>

                {/* KPI Tiles */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
                    <div className="glass-card red" style={{ padding: "20px", border: "1px solid rgba(242,157,145,0.4)" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                            <BarChart2 size={18} /> Overall No-Show Rate
                        </p>
                        <h1 style={{ color: "#e53935", fontSize: "36px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {stats.overallNoShowRate}%
                        </h1>
                    </div>
                    
                    <div className="glass-card green" style={{ padding: "20px", border: "1px solid rgba(76,175,80,0.4)" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                            <BookOpen size={18} /> Avg Training Hours
                        </p>
                        <h1 style={{ color: "#4caf50", fontSize: "36px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {stats.avgHrsPerStaff}h
                        </h1>
                    </div>

                    <div className="glass-card blue" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                            Select Training Course
                        </p>
                        <select
                            value={activeCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            style={{ 
                                fontSize: "14px", 
                                padding: "10px 15px", 
                                borderRadius: "12px", 
                                border: "1px solid rgba(74, 106, 133, 0.2)", 
                                background: "rgba(255, 255, 255, 0.65)", 
                                color: "#1e293b", 
                                fontWeight: 600,
                                width: "100%",
                                cursor: "pointer",
                                outline: "none",
                                transition: "all 0.2s ease-in-out"
                            }}
                            onFocus={(e) => {
                                e.target.style.background = "white";
                                e.target.style.borderColor = "var(--accent-blue)";
                            }}
                            onBlur={(e) => {
                                e.target.style.background = "rgba(255, 255, 255, 0.65)";
                                e.target.style.borderColor = "rgba(74, 106, 133, 0.2)";
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = "rgba(255, 255, 255, 0.85)";
                            }}
                            onMouseLeave={(e) => {
                                if (document.activeElement !== e.target) {
                                    e.target.style.background = "rgba(255, 255, 255, 0.65)";
                                }
                            }}
                        >
                            {courseNames.map(n => <option key={n} value={n} style={{ background: "white", color: "#1e293b" }}>{n}</option>)}
                        </select>
                    </div>

                    <div className="glass-card purple" style={{ padding: "20px" }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                            Total Units Tracked
                        </p>
                        <h1 style={{ color: "#6a1b9a", fontSize: "36px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {stats.unitData?.length || 0}
                        </h1>
                    </div>
                </div>

                {/* Expanded Chart Card */}
                <div className="table-box content-box chart-card" style={{ padding: "25px", marginBottom: "25px" }}>
                    
                    {/* Print-only Chart Header */}
                    <div className="print-only-chart-header" style={{ borderBottom: "2px solid #243647", paddingBottom: "12px", marginBottom: "25px" }}>
                        <h1 style={{ fontSize: "24px", color: "#243647", margin: 0, fontWeight: 800 }}>Unit Absenteeism Trend (%)</h1>
                        <p style={{ margin: "5px 0 0 0", color: "#475569", fontSize: "14px" }}>
                            Generated on: {new Date().toLocaleDateString()} | Course Selected: <strong>{activeCourse}</strong>
                        </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                Unit Absenteeism Trend (%) — {activeCourse}
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                Displays the percentage of staff with Pending/Overdue training statuses per hospital unit.
                            </p>
                        </div>
                        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
                                <input 
                                    type="checkbox" 
                                    checked={hideZeroRates} 
                                    onChange={e => setHideZeroRates(e.target.checked)}
                                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                />
                                Hide 0% Absenteeism
                            </label>
                            <button 
                                onClick={generatePDF} 
                                className="icon-btn-small" 
                                style={{ padding: "8px 15px", border: "1px solid #dde3ea", display: "flex", alignItems: "center", gap: "6px", background: "var(--accent-blue)", color: "white", fontWeight: 600 }}
                            >
                                <Download size={14} /> Generate Report
                            </button>
                        </div>
                    </div>

                    <div className="chart-scroll-container" style={{ maxHeight: "500px", overflowY: "auto", overflowX: "hidden", width: "100%", paddingRight: "5px" }}>
                        <div style={{ height: `${Math.max(350, filteredUnitData.length * 32)}px`, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    layout="vertical"
                                    data={filteredUnitData} 
                                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis 
                                        type="number"
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                                    />
                                    <YAxis 
                                        dataKey="unit" 
                                        type="category"
                                        width={180}
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 11, fontWeight: 600, fill: "var(--text-primary)" }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: "rgba(0,0,0,0.03)" }} 
                                        formatter={(val) => [`${val}%`, "No-Show Rate"]}
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #dde3ea", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                                    />
                                    <Bar dataKey="rate" fill="#f29d91" radius={[0, 4, 4, 0]} barSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table Section */}
                <div className="table-box content-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                All Hospital Units Breakdown
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                Full comparative list of units sorted alphabetically with specific training statistics.
                            </p>
                        </div>

                        {/* Search and Filters */}
                        <div className="no-print" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                <Search size={16} style={{ position: "absolute", left: "12px", color: "var(--text-secondary)" }} />
                                <input 
                                    type="text" 
                                    placeholder="Search unit name..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="search-input"
                                    style={{ paddingLeft: "36px", width: "220px", height: "38px" }}
                                />
                            </div>

                            <div style={{ display: "flex", background: "rgba(0,0,0,0.05)", borderRadius: "8px", padding: "3px" }}>
                                {["All", "In-Patient", "Out-Patient"].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "6px",
                                            border: "none",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            background: selectedCategory === cat ? "var(--accent-blue)" : "transparent",
                                            color: selectedCategory === cat ? "white" : "var(--text-secondary)",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Comparative Table */}
                    <div className="custom-table">
                        <div className="table-header" style={{ gridTemplateColumns: "2.5fr 1.5fr 2fr 1.5fr", padding: "12px 20px" }}>
                            <span>Hospital Unit Name</span>
                            <span>Category</span>
                            <span>Absentee / No-Show Rate</span>
                            <span>Compliance Status</span>
                        </div>
                        <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                            {filteredUnitData.length > 0 ? (
                                filteredUnitData.map((d, index) => {
                                    const lowerUnit = d.unit.toLowerCase();
                                    const isInPatient = !lowerUnit.includes("er") && !lowerUnit.includes("opd") && !lowerUnit.includes("or") && 
                                                        !lowerUnit.includes("recovery") && !lowerUnit.includes("surgery") && !lowerUnit.includes("dialysis") &&
                                                        !lowerUnit.includes("famco") && !lowerUnit.includes("endoscopy");
                                    const category = isInPatient ? "In-Patient" : "Out-Patient";

                                    let complianceStatus = "Optimal";
                                    let statusColor = "#4caf50";
                                    if (d.rate > 30) {
                                        complianceStatus = "Needs Attention";
                                        statusColor = "#e53935";
                                    } else if (d.rate > 10) {
                                        complianceStatus = "Satisfactory";
                                        statusColor = "#ff9800";
                                    }

                                    return (
                                        <div 
                                            className="table-row premium-row" 
                                            key={index}
                                            style={{ gridTemplateColumns: "2.5fr 1.5fr 2fr 1.5fr", padding: "14px 20px", alignItems: "center" }}
                                        >
                                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.unit}</span>
                                            <span style={{ color: "var(--text-secondary)" }}>{category}</span>
                                            <span style={{ fontWeight: 700, color: d.rate > 20 ? "#e53935" : "#243647" }}>
                                                {d.rate.toFixed(1)}%
                                            </span>
                                            <span style={{ fontWeight: 800, color: statusColor }}>
                                                {complianceStatus}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                    No hospital units found matching the filter criteria.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
