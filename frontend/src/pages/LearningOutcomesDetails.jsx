import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    ArrowLeft, Loader, Search, RefreshCw, BarChart2, BookOpen, 
    Download, Award, CheckCircle, TrendingUp, Filter 
} from "lucide-react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    Legend, ResponsiveContainer 
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/Layout";
import "../styles/DirectorDashboard.css";
import "../styles/TrainingDirectorDashboard.css";

// Helper to shorten course names for chart display
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

export default function LearningOutcomesDetails() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("All");
    const [selectedCourse, setSelectedCourse] = useState("All");
    const [scoreStatusFilter, setScoreStatusFilter] = useState("All"); // "All" | "Passed" | "Needs Attention"
    const [chartMetric, setChartMetric] = useState("scores"); // "scores" | "staffCount"

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
                    <p style={{ marginTop: "15px", color: "var(--text-secondary)" }}>Loading Learning Outcomes...</p>
                </div>
            </Layout>
        );
    }

    const allScores = dashboardData?.allTestScores || [];
    const units = [...new Set(allScores.map(s => s.specialty).filter(Boolean))].sort();
    const courses = [...new Set(allScores.map(s => s.course).filter(Boolean))].sort();

    // Filter scores
    const filteredScores = allScores.filter(s => {
        const matchesSearch = 
            s.nurse.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.course.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUnit = selectedUnit === "All" || s.specialty === selectedUnit;
        const matchesCourse = selectedCourse === "All" || s.course === selectedCourse;
        
        const preVal = Number(s.preTest);
        const postVal = Number(s.postTest);
        const isPassed = postVal >= 80;
        
        let matchesStatus = true;
        if (scoreStatusFilter === "Passed") matchesStatus = isPassed;
        else if (scoreStatusFilter === "Needs Attention") matchesStatus = !isPassed;

        return matchesSearch && matchesUnit && matchesCourse && matchesStatus;
    });

    // Compute dynamic KPI summary metrics
    const totalGraded = filteredScores.length;
    let avgPre = 0;
    let avgPost = 0;
    let avgImprovement = 0;

    if (totalGraded > 0) {
        const preSum = filteredScores.reduce((sum, s) => sum + Number(s.preTest || 0), 0);
        const postSum = filteredScores.reduce((sum, s) => sum + Number(s.postTest || 0), 0);
        avgPre = Math.round(preSum / totalGraded);
        avgPost = Math.round(postSum / totalGraded);
        
        const improvSum = filteredScores.reduce((sum, s) => {
            const diff = Number(s.postTest || 0) - Number(s.preTest || 0);
            return sum + (diff > 0 ? diff : 0);
        }, 0);
        avgImprovement = Math.round(improvSum / totalGraded);
    }

    // Compute dynamic chart data
    const isSingleCourse = selectedCourse !== "All";
    const groupKey = isSingleCourse ? "specialty" : "course";
    const grouped = {};

    filteredScores.forEach(score => {
        const key = score[groupKey];
        if (!grouped[key]) {
            grouped[key] = { label: key, preSum: 0, preCount: 0, postSum: 0, postCount: 0, staffCount: 0 };
        }
        const pre = Number(score.preTest);
        const post = Number(score.postTest);
        if (!isNaN(pre)) {
            grouped[key].preSum += pre;
            grouped[key].preCount += 1;
        }
        if (!isNaN(post)) {
            grouped[key].postSum += post;
            grouped[key].postCount += 1;
        }
        grouped[key].staffCount += 1;
    });

    const chartData = Object.values(grouped).map(g => ({
        label: isSingleCourse ? g.label : getShortName(g.label),
        fullName: g.label,
        preTest: g.preCount > 0 ? Math.round(g.preSum / g.preCount) : 0,
        postTest: g.postCount > 0 ? Math.round(g.postSum / g.postCount) : 0,
        staffCount: g.staffCount
    })).sort((a, b) => chartMetric === "scores" ? b.postTest - a.postTest : b.staffCount - a.staffCount);

    // PDF Report Generator
    const generatePDF = () => {
        const doc = new jsPDF();
        
        // Header styling
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(36, 54, 71); // #243647
        doc.text("KFHU Learning Outcomes & Test Scores Report", 14, 22);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(
            `Generated on: ${new Date().toLocaleDateString()} | Unit Filter: ${selectedUnit} | Course Filter: ${selectedCourse}`, 
            14, 28
        );
        
        // Summary KPIs Section in PDF
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary Metrics:", 14, 38);
        
        doc.setFont("helvetica", "normal");
        doc.text(`• Total Staff Records Evaluated: ${totalGraded}`, 16, 44);
        doc.text(`• Average Pre-Test Score: ${avgPre}%`, 16, 50);
        doc.text(`• Average Post-Test Score: ${avgPost}%`, 16, 56);
        doc.text(`• Average Score Improvement: +${avgImprovement}%`, 16, 62);
        
        // Table data collection
        const tableRows = filteredScores.map((s, index) => {
            const preVal = Number(s.preTest || 0);
            const postVal = Number(s.postTest || 0);
            const diff = postVal - preVal;
            const status = postVal >= 80 ? "Passed" : "Needs Attention";
            return [
                s.nurse,
                s.specialty,
                s.course,
                `${preVal.toFixed(0)}%`,
                `${postVal.toFixed(0)}%`,
                `+${diff.toFixed(0)}%`,
                status
            ];
        });

        autoTable(doc, {
            startY: 70,
            head: [["Staff Name", "Hospital Unit", "Training Course", "Pre-Test", "Post-Test", "Improvement", "Status"]],
            body: tableRows,
            theme: "grid",
            headStyles: { fillColor: [36, 54, 71], fontStyle: "bold" },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: "bold", width: 35 },
                1: { width: 25 },
                2: { width: 45 },
                3: { halign: "center" },
                4: { halign: "center", fontStyle: "bold" },
                5: { halign: "center" },
                6: { fontStyle: "bold" }
            }
        });

        doc.save(`kfhu_learning_outcomes_report_${new Date().toISOString().split("T")[0]}.pdf`);
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
                        margin-bottom: 20px !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
            
            <div className="main" style={{ maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "20px" }}>
                
                {/* Header Actions */}
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
                            Learning Outcomes &amp; Test Scores Detail
                        </h1>
                    </div>
                </div>

                {/* Print Only Title */}
                <div className="print-only-header">
                    <h1 style={{ fontSize: "24px", color: "#243647", margin: 0, fontWeight: 800 }}>KFHU Learning Outcomes &amp; Test Scores Report</h1>
                    <p style={{ margin: "5px 0 0 0", color: "#475569", fontSize: "12px" }}>
                        Generated on: {new Date().toLocaleDateString()} | Unit: {selectedUnit} | Course: {selectedCourse}
                    </p>
                </div>

                {/* Summary KPI Tiles */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
                    <div className="glass-card blue" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                            <BookOpen size={16} /> Graded Records
                        </p>
                        <h1 style={{ color: "var(--accent-blue)", fontSize: "32px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {totalGraded}
                        </h1>
                    </div>

                    <div className="glass-card yellow" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                            <TrendingUp size={16} /> Avg Pre-Test Score
                        </p>
                        <h1 style={{ color: "#ff9800", fontSize: "32px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {avgPre}%
                        </h1>
                    </div>

                    <div className="glass-card green" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                            <Award size={16} /> Avg Post-Test Score
                        </p>
                        <h1 style={{ color: "#4caf50", fontSize: "32px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            {avgPost}%
                        </h1>
                    </div>

                    <div className="glass-card purple" style={{ padding: "20px" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                            <CheckCircle size={16} /> Avg Score Growth
                        </p>
                        <h1 style={{ color: "#9c27b0", fontSize: "32px", margin: "10px 0 0 0", fontWeight: 800 }}>
                            +{avgImprovement}%
                        </h1>
                    </div>
                </div>

                {/* Score Chart Card */}
                <div className="table-box content-box" style={{ padding: "25px", marginBottom: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                {chartMetric === "scores" 
                                    ? (isSingleCourse ? `Score Averages by Unit — ${selectedCourse}` : "Average Test Scores by Training Program")
                                    : (isSingleCourse ? `Staff Count by Unit — ${selectedCourse}` : "Staff Count by Training Program")}
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                {chartMetric === "scores" 
                                    ? "Displays dynamic pre-test vs. post-test comparisons based on filter criteria."
                                    : "Displays the number of graded staff members based on filter criteria."}
                            </p>
                        </div>
                        <div className="no-print" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            {/* Metric Toggle */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                                <button
                                    onClick={() => setChartMetric("scores")}
                                    style={{
                                        padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        background: chartMetric === 'scores' ? 'var(--accent-blue)' : 'transparent',
                                        color: chartMetric === 'scores' ? 'white' : 'var(--text-secondary)'
                                    }}
                                >Scores</button>
                                <button
                                    onClick={() => setChartMetric("staffCount")}
                                    style={{
                                        padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        background: chartMetric === 'staffCount' ? 'var(--accent-blue)' : 'transparent',
                                        color: chartMetric === 'staffCount' ? 'white' : 'var(--text-secondary)'
                                    }}
                                >Staff Count</button>
                            </div>
                            <button 
                                onClick={generatePDF} 
                                className="icon-btn-small" 
                                style={{ padding: "8px 15px", border: "1px solid #dde3ea", display: "flex", alignItems: "center", gap: "6px", background: "var(--accent-blue)", color: "white", fontWeight: 600 }}
                            >
                                <Download size={14} /> Generate Report
                            </button>
                        </div>
                    </div>

                    <div style={{ height: "350px", width: "100%" }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis 
                                        dataKey="label" 
                                        tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        height={60}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        domain={chartMetric === "scores" ? [0, 100] : [0, 'auto']}
                                        tickFormatter={(val) => chartMetric === "scores" ? `${val}%` : val}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                                    />
                                    <Tooltip 
                                        formatter={(val) => chartMetric === "scores" ? [`${val}%`] : [`${val}`, "Staff Count"]}
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #dde3ea" }}
                                    />
                                    <Legend />
                                    {chartMetric === "scores" ? (
                                        <>
                                            <Bar dataKey="preTest" name="Pre-Test" fill="#9cb5f1" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="postTest" name="Post-Test" fill="#6082e6" radius={[4, 4, 0, 0]} />
                                        </>
                                    ) : (
                                        <Bar dataKey="staffCount" name="Staff Count" fill="#6082e6" radius={[4, 4, 0, 0]} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                                No score data to plot.
                            </div>
                        )}
                    </div>
                </div>

                {/* Score Table Grid & Filters */}
                <div className="table-box content-box" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                Detailed Score Roster
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                Complete records matching filters. Passing score threshold is 80%.
                            </p>
                        </div>

                        {/* Search and Filters */}
                        <div className="no-print" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            {/* Search bar */}
                            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                <Search size={16} style={{ position: "absolute", left: "12px", color: "var(--text-secondary)" }} />
                                <input 
                                    type="text" 
                                    placeholder="Search staff or course..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="search-input"
                                    style={{ paddingLeft: "36px", width: "210px", height: "38px" }}
                                />
                            </div>

                            {/* Unit Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Unit:</span>
                                <select 
                                    value={selectedUnit} 
                                    onChange={e => setSelectedUnit(e.target.value)}
                                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #dde3ea", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                >
                                    <option value="All">All Units</option>
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            {/* Course Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Course:</span>
                                <select 
                                    value={selectedCourse} 
                                    onChange={e => setSelectedCourse(e.target.value)}
                                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #dde3ea", fontSize: "13px", fontWeight: 600, cursor: "pointer", maxWidth: "180px" }}
                                >
                                    <option value="All">All Courses</option>
                                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Status:</span>
                                <select 
                                    value={scoreStatusFilter} 
                                    onChange={e => setScoreStatusFilter(e.target.value)}
                                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #dde3ea", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                >
                                    <option value="All">All Scores</option>
                                    <option value="Passed">Passed (≥80%)</option>
                                    <option value="Needs Attention">Needs Attention (&lt;80%)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="custom-table">
                        <div className="table-header" style={{ gridTemplateColumns: "1.5fr 1.2fr 2fr 1fr 1fr 1fr 1.2fr", padding: "12px 20px" }}>
                            <span>Staff Name</span>
                            <span>Hospital Unit</span>
                            <span>Training Course</span>
                            <span style={{ textAlign: "center" }}>Pre-Test</span>
                            <span style={{ textAlign: "center" }}>Post-Test</span>
                            <span style={{ textAlign: "center" }}>Growth</span>
                            <span>Passing Status</span>
                        </div>
                        <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                            {filteredScores.length > 0 ? (
                                filteredScores.map((s, index) => {
                                    const preVal = Number(s.preTest || 0);
                                    const postVal = Number(s.postTest || 0);
                                    const diff = postVal - preVal;
                                    const isPassed = postVal >= 80;

                                    return (
                                        <div 
                                            className="table-row premium-row" 
                                            key={index}
                                            style={{ gridTemplateColumns: "1.5fr 1.2fr 2fr 1fr 1fr 1fr 1.2fr", padding: "14px 20px", alignItems: "center" }}
                                        >
                                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{s.nurse}</span>
                                            <span style={{ color: "var(--text-secondary)" }}>{s.specialty}</span>
                                            <span style={{ fontWeight: 500 }}>{s.course}</span>
                                            <span style={{ textAlign: "center", color: "var(--text-secondary)" }}>{preVal.toFixed(0)}%</span>
                                            <span style={{ textAlign: "center", fontWeight: 700, color: isPassed ? "#4caf50" : "#ff9800" }}>
                                                {postVal.toFixed(0)}%
                                            </span>
                                            <span style={{ textAlign: "center", color: diff >= 0 ? "#4caf50" : "#f44336", fontWeight: 600 }}>
                                                {diff >= 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`}
                                            </span>
                                            <span 
                                                className={`status ${isPassed ? "approved" : "pending"}`}
                                                style={{ fontSize: "11px", padding: "4px 10px", width: "fit-content", textAlign: "center", fontWeight: 700 }}
                                            >
                                                {isPassed ? "Passed" : "Needs Attention"}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                    No records found matching filters.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
