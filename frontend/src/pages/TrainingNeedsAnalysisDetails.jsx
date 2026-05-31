import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, Search, RefreshCw, AlertTriangle, ShieldAlert, BookOpen, Download, LayoutGrid } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/Layout";
import "../styles/DirectorDashboard.css";
import "../styles/TrainingDirectorDashboard.css";

export default function TrainingNeedsAnalysisDetails() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [gapFilter, setGapFilter] = useState("All"); // "All" | "High" | "Med" | "Low"

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:4000/api/training/dashboard/data");
            const data = await res.json();
            setDashboardData(data);
        } catch (err) {
            console.error("Failed to load needs analysis data", err);
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
                    <p style={{ marginTop: "15px", color: "var(--text-secondary)" }}>Loading Needs Analysis Data...</p>
                </div>
            </Layout>
        );
    }

    const needs = dashboardData?.needsAnalysis || {
        competencyGaps: [],
        cpdCompleted: 0,
        cpdRequired: 1,
        newHiresMissingBasics: 0,
        unverifiedFloatStaff: 0
    };

    const competencyGaps = needs.competencyGaps || [];
    
    // Total gaps stats
    const totalGapsCount = competencyGaps.reduce((acc, curr) => acc + curr.nonCompleted, 0);
    const highGapUnitsCount = competencyGaps.filter(u => u.gapLevel === "High Gap").length;
    const cpdPercent = Math.round((needs.cpdCompleted / (needs.cpdRequired || 1)) * 100);

    // Filtered data for presentation
    const filteredGaps = competencyGaps.filter(d => {
        const matchesSearch = d.unit.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesFilter = true;
        if (gapFilter === "High") matchesFilter = d.gapLevel === "High Gap";
        else if (gapFilter === "Med") matchesFilter = d.gapLevel === "Med Gap";
        else if (gapFilter === "Low") matchesFilter = d.gapLevel === "Low Gap";

        return matchesSearch && matchesFilter;
    });

    const generatePDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(36, 54, 71); // #243647
        doc.text("KFHU Training Needs & Competency Gaps Report", 14, 22);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | Department: Nursing Services`, 14, 28);
        
        // Summary KPIs
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary:", 14, 38);
        
        doc.setFont("helvetica", "normal");
        doc.text(`• Total Gaps Identified: ${totalGapsCount}`, 16, 44);
        doc.text(`• Critical Gap Units (>=50%): ${highGapUnitsCount}`, 16, 50);
        doc.text(`• CPD/CME Hours Progress: ${needs.cpdCompleted} hrs completed of ${needs.cpdRequired} hrs required (${cpdPercent}%)`, 16, 56);
        doc.text(`• High-Risk Staff: ${needs.newHiresMissingBasics} New Hires Missing Basics, ${needs.unverifiedFloatStaff} Unverified Float Staff`, 16, 62);
        
        // Competencies Table
        const tableData = filteredGaps.map(d => [
            d.unit,
            d.total,
            d.nonCompleted,
            `${d.gapPercent}%`,
            d.gapLevel
        ]);

        autoTable(doc, {
            startY: 70,
            head: [["Hospital Unit Name", "Total Competencies", "Pending / Gaps", "Gap Percentage", "Gap Level"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [36, 54, 71], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: 'bold' },
                3: { fontStyle: 'bold' }
            }
        });

        doc.save(`kfhu_training_needs_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Layout role="trainingDirector" username={user.full_name || "Training Director"}>
            <style>{`
                @media screen {
                    .print-only-header {
                        display: none !important;
                    }
                }
                @media print {
                    aside, .sidebar, nav, header, .back-btn, button, .icon-btn-small, .search-input, select, .no-print, input, label {
                        display: none !important;
                    }
                    body, .main, #root, .content-box, .custom-table {
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .main {
                        padding: 0 !important;
                    }
                    .print-only-header {
                        display: block !important;
                        border-bottom: 2px solid #243647 !important;
                        padding-bottom: 10px !important;
                        margin-bottom: 25px !important;
                    }
                    .heatmap-grid {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 15px !important;
                        margin-top: 15px !important;
                        page-break-inside: avoid;
                    }
                    .heatmap-cell {
                        color: black !important;
                        border: 1px solid #ddd !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .custom-table div {
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    .content-box {
                        page-break-inside: avoid;
                        margin-bottom: 30px !important;
                        border: 1px solid #ddd !important;
                    }
                }
            `}</style>

            <div className="main" style={{ maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "20px" }}>
                
                {/* Print-only Report Header */}
                <div className="print-only-header">
                    <h1 style={{ fontSize: "28px", color: "#243647", margin: 0, fontWeight: 800 }}>KFHU Training Needs &amp; Competency Gaps Report</h1>
                    <p style={{ margin: "5px 0 0 0", color: "#475569", fontSize: "14px" }}>
                        Generated on: {new Date().toLocaleDateString()} | Department: <strong>Nursing Services</strong>
                    </p>
                </div>

                {/* Header Row */}
                <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button 
                            className="back-btn" 
                            onClick={() => navigate("/training-director-dashboard")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, padding: "8px 16px" }}
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button 
                                onClick={generatePDF} 
                                className="icon-btn-small" 
                                style={{ padding: "8px 15px", border: "1px solid #dde3ea", display: "flex", alignItems: "center", gap: "6px", background: "var(--accent-blue)", color: "white", fontWeight: 600 }}
                            >
                                <Download size={14} /> Generate Report
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
                    </div>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                            Training Needs Analysis
                        </h1>
                    </div>
                </div>

                {/* KPI Tiles */}
                <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
                    <div className="glass-card red" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                            <AlertTriangle size={18} /> Total Gaps Identified
                        </p>
                        <h1 style={{ color: "#e53935", fontSize: "36px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {totalGapsCount}
                        </h1>
                    </div>
                    
                    <div className="glass-card yellow" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                            <ShieldAlert size={18} /> Critical Gap Units (≥50%)
                        </p>
                        <h1 style={{ color: "var(--accent-orange)", fontSize: "36px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {highGapUnitsCount}
                        </h1>
                    </div>

                    <div className="glass-card green" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                            <BookOpen size={18} /> CPD Progress ({needs.cpdCompleted}h)
                        </p>
                        <h1 style={{ color: "#4caf50", fontSize: "36px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {cpdPercent}%
                        </h1>
                    </div>

                    <div className="glass-card purple" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                            <LayoutGrid size={18} /> High-Risk Staff Flags
                        </p>
                        <div style={{ marginTop: "10px", width: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#7e57c2" }}>
                                <span>New Hires Missing:</span>
                                <span>{needs.newHiresMissingBasics}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#7e57c2", marginTop: "2px" }}>
                                <span>Unverified Float:</span>
                                <span>{needs.unverifiedFloatStaff}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Heatmap Grid (Competency Gaps by Unit) */}
                <div className="table-box content-box" style={{ padding: "25px", marginBottom: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                Competency Gaps by Unit (All Units Heatmap)
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                Shows the percentage of incomplete or pending competencies per hospital unit.
                            </p>
                        </div>
                        <div className="no-print" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <select 
                                value={gapFilter}
                                onChange={e => setGapFilter(e.target.value)}
                                style={{
                                    fontSize: "13px", 
                                    padding: "8px 12px", 
                                    borderRadius: "8px", 
                                    border: "1px solid #dde3ea", 
                                    background: "rgba(255,255,255,0.75)",
                                    fontWeight: 600
                                }}
                            >
                                <option value="All">All Gaps</option>
                                <option value="High">High Gaps (≥50%)</option>
                                <option value="Med">Medium Gaps (15% - 49%)</option>
                                <option value="Low">Low Gaps (&lt;15%)</option>
                            </select>
                        </div>
                    </div>

                    <div className="heatmap-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "15px", maxHeight: "400px", overflowY: "auto", paddingRight: "5px" }}>
                        {filteredGaps.length > 0 ? (
                            filteredGaps.map((item, index) => (
                                <div 
                                    key={index} 
                                    className="heatmap-cell" 
                                    style={{ 
                                        background: item.color, 
                                        padding: "20px 10px", 
                                        borderRadius: "12px", 
                                        textAlign: "center", 
                                        color: "white", 
                                        fontWeight: 800, 
                                        fontSize: "14px",
                                        boxShadow: "0 4px 6px rgba(0,0,0,0.06)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px"
                                    }}
                                >
                                    <span style={{ fontSize: "15px" }}>{item.unit}</span>
                                    <span className="heatmap-label" style={{ fontSize: "11px", opacity: 0.9 }}>
                                        {item.gapLevel} ({item.gapPercent}%)
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
                                No hospital units match the filter criteria.
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Table Breakdown */}
                <div className="table-box content-box no-print">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                Unit Competency Breakdown Table
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                Full list of units with total competency requirements, pending requests, and gap statistics.
                            </p>
                        </div>
                        <div className="no-print">
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
                        </div>
                    </div>

                    <div className="custom-table">
                        <div className="table-header" style={{ gridTemplateColumns: "2.5fr 1.5fr 1.5fr 1.5fr", padding: "12px 20px" }}>
                            <span>Hospital Unit Name</span>
                            <span>Total Competencies</span>
                            <span>Pending / Gaps</span>
                            <span>Gap Percentage</span>
                        </div>
                        <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                            {filteredGaps.length > 0 ? (
                                filteredGaps.map((d, index) => {
                                    return (
                                        <div 
                                            className="table-row premium-row" 
                                            key={index}
                                            style={{ gridTemplateColumns: "2.5fr 1.5fr 1.5fr 1.5fr", padding: "14px 20px", alignItems: "center" }}
                                        >
                                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.unit}</span>
                                            <span style={{ color: "var(--text-secondary)" }}>{d.total}</span>
                                            <span style={{ fontWeight: 700, color: d.nonCompleted > 0 ? "#ff9800" : "#4caf50" }}>
                                                {d.nonCompleted}
                                            </span>
                                            <span style={{ fontWeight: 800, color: d.color }}>
                                                {d.gapPercent}% ({d.gapLevel.split(" ")[0]})
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                    No records found matching the search criteria.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
