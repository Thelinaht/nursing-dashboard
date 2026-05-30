import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, Search, RefreshCw, BarChart2, BookOpen, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
            return matchesSearch && matchesCategory;
        });

    return (
        <Layout role="trainingDirector" username={user.full_name || "Training Director"}>
            <div className="main" style={{ maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "20px" }}>
                
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <button 
                            className="back-btn" 
                            onClick={() => navigate("/training-director-dashboard")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, padding: "8px 16px" }}
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>
                        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                            Staff Participation &amp; Attendance Details
                        </h1>
                    </div>
                    <button 
                        onClick={fetchData} 
                        className="icon-btn-small" 
                        style={{ padding: "8px 12px", border: "1px solid #dde3ea", display: "flex", alignItems: "center", gap: "6px" }}
                        title="Refresh Data"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
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
                                padding: "10px", 
                                borderRadius: "8px", 
                                border: "1px solid #dde3ea", 
                                background: "white", 
                                color: "#243647", 
                                fontWeight: 600,
                                width: "100%" 
                            }}
                        >
                            {courseNames.map(n => <option key={n} value={n}>{n}</option>)}
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
                <div className="table-box content-box" style={{ padding: "25px", marginBottom: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                Unit Absenteeism Trend (%) — {activeCourse}
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                Displays the percentage of staff with Pending/Overdue training statuses per hospital unit.
                            </p>
                        </div>
                    </div>

                    <div style={{ height: "450px", width: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredUnitData} margin={{ top: 10, right: 10, left: -20, bottom: 90 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="unit" 
                                    interval={0} 
                                    tick={{ fontSize: 10, fontWeight: 500, fill: "var(--text-primary)" }}
                                    angle={-45}
                                    textAnchor="end"
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <YAxis 
                                    tick={{ fontSize: 11 }} 
                                    axisLine={false} 
                                    tickLine={false}
                                    label={{ value: 'No-Show Rate (%)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, fill: 'var(--text-secondary)' } }}
                                />
                                <Tooltip 
                                    cursor={{ fill: "rgba(0,0,0,0.03)" }} 
                                    formatter={(val) => [`${val}%`, "No-Show Rate"]}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #dde3ea", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                                />
                                <Bar dataKey="rate" fill="#f29d91" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
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
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
