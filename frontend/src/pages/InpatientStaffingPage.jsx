import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, ArrowLeft, ArrowRight, Users, AlertCircle, Activity, FileText } from "lucide-react";
import Layout from "../components/Layout";
import "../styles/SecretaryDashboard.css"; // Include for filter-grid, glass-card, table-box
import "../styles/DirectorDashboard.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InpatientStaffingPage() {
    const navigate = useNavigate();
    const [inpatientStaffing, setInpatientStaffing] = useState([]);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ unit: "", status: "" });
    const [staffingPage, setStaffingPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const roleMap = { 1: "nurse", 2: "secretary", 3: "supervisor", 4: "director", 5: "qualityManager", 6: "trainingDirector", 7: "researchDirector", 8: "assistantDirector" };
    const titleMap = { 1: "Nurse", 2: "Secretary", 3: "Supervisor", 4: "Director", 5: "Quality Manager", 6: "Training Director", 7: "Researcher", 8: "Patient Services" };
    const layoutRole = user?.role_id ? roleMap[user.role_id] : "director";
    const displayUsername = user?.full_name || titleMap[user.role_id] || "Director";

    const fetchInpatientStaffing = async () => {
        try {
            const res = await fetch("http://localhost:4000/api/dashboard/inpatient-staffing");
            const data = await res.json();
            setInpatientStaffing(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching inpatient staffing:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInpatientStaffing();
    }, []);

    const unitNames = [...new Set(inpatientStaffing.map(r => r.unit_name))].sort();

    const filteredStaffing = inpatientStaffing.filter(row => {
        // Status filter
        if (filters.status && row.status !== filters.status) return false;

        // Unit filter
        if (filters.unit && row.unit_name !== filters.unit) return false;

        // Search text
        if (search) {
            if (!row.unit_name.toLowerCase().includes(search.toLowerCase())) return false;
        }

        return true;
    });

    const staffingRowsPerPage = 10;
    const totalStaffingPages = Math.ceil(filteredStaffing.length / staffingRowsPerPage);
    const currentStaffingPageRows = filteredStaffing.slice((staffingPage - 1) * staffingRowsPerPage, staffingPage * staffingRowsPerPage);

    // reset pagination on filter change
    useEffect(() => { setStaffingPage(1); }, [search, filters]);

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Inpatient Staffing Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = filteredStaffing.map(row => [
            row.unit_name || "N/A",
            String(row.bed_census),
            row.required_ratio || "N/A",
            String(row.available_nurses),
            String(row.total_needed),
            String(row.gap),
            row.status || "N/A"
        ]);

        autoTable(doc, {
            startY: 40,
            head: [["Unit Name", "Bed Census", "Required Ratio", "Available Nurses", "Total Needed", "Gap", "Status"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [74, 106, 133] }
        });

        doc.save("Inpatient_Staffing.pdf");
    };

    const criticalUnitsCount = inpatientStaffing.filter(r => r.status === 'Critical').length;
    const totalGap = inpatientStaffing.reduce((sum, r) => sum + Number(r.gap), 0);

    return (
        <Layout logoSrc="/logo.png" role={layoutRole} username={displayUsername}>
            <div className="main" style={{ padding: '0 20px' }}>
                {/* Header Row */}
                <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button 
                            className="back-btn" 
                            onClick={() => navigate("/director-dashboard")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, padding: "8px 16px" }}
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button className="btn-pill" style={{ background: 'var(--accent-blue)', color: 'white', padding: '10px 20px', gap: '8px' }} onClick={generatePDF}>
                                <FileText size={18} /> Generate Report
                            </button>
                        </div>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '28px', color: '#2c3e50', margin: 0, fontWeight: 800 }}>Inpatient Staffing</h2>
                    </div>
                </div>

                <div className="cards-row" style={{ marginBottom: '30px', display: 'flex', gap: '20px' }}>
                    <div className="glass-card blue" style={{ flex: 1, minWidth: '200px' }}>
                        <p><Activity size={20} /> Inpatient Units</p>
                        <h1>{inpatientStaffing.length}</h1>
                    </div>
                    <div className="glass-card green" style={{ flex: 1, minWidth: '200px' }}>
                        <p><Users size={20} /> Assigned Inpatient Nurses</p>
                        <h1>{inpatientStaffing.reduce((sum, r) => sum + r.available_nurses, 0)}</h1>
                    </div>
                    <div className="glass-card red" style={{ flex: 1, minWidth: '200px' }}>
                        <p><AlertCircle size={20} /> Inpatient Deficit</p>
                        <h1>{Math.abs(Math.min(totalGap, 0))}</h1>
                    </div>
                </div>

                <div className="table-box" style={{ marginBottom: '30px', padding: '20px' }}>
                    <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search by unit name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-pill"
                                style={{ paddingLeft: '40px', width: '100%' }}
                            />
                        </div>
                        <select
                            className="input-pill"
                            value={filters.unit}
                            onChange={(e) => setFilters(prev => ({ ...prev, unit: e.target.value }))}
                        >
                            <option value="">All Units</option>
                            {unitNames.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <select
                            className="input-pill"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            <option value="OK">OK</option>
                            <option value="Partial">Partial</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>

                <div className="table-box content-box">
                    <div className="table-header-row" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '15px', marginBottom: '16px' }}>
                        <h2 className="table-title">Unit Staffing Requirements</h2>
                    </div>

                    <div className="list-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
                        <span>Unit name</span>
                        <span>Bed census</span>
                        <span>Required ratio</span>
                        <span>Available nurses</span>
                        <span>Total needed</span>
                        <span>Gap</span>
                        <span>Status</span>
                    </div>
                    <div className="nurses-list">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#8ea2b5' }}>Loading staffing data...</div>
                        ) : currentStaffingPageRows.length > 0 ? currentStaffingPageRows.map((row, idx) => (
                            <div key={idx} className="nurse-card premium-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', alignItems: 'center' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.unit_name}</div>
                                <div style={{ color: '#5a738e' }}>{row.bed_census}</div>
                                <div>{row.required_ratio}</div>
                                <div style={{ fontWeight: 600 }}>{row.available_nurses}</div>
                                <div>{row.total_needed}</div>
                                <div style={{ fontWeight: 900, color: Number(row.gap) < 0 ? '#ef4444' : '#10b981' }}>
                                    {Number(row.gap) > 0 ? `+${row.gap}` : row.gap}
                                </div>
                                <div>
                                    <span className={`status ${row.status?.toLowerCase()}`} style={{ 
                                        backgroundColor: row.status === 'OK' ? '#dcfce7' : row.status === 'Partial' ? '#fef3c7' : '#fee2e2', 
                                        color: row.status === 'OK' ? '#16a34a' : row.status === 'Partial' ? '#d97706' : '#dc2626',
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                                    }}>
                                        {row.status}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#8ea2b5' }}>No units match this filter.</div>
                        )}
                    </div>
                    
                    {totalStaffingPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                            <button 
                                disabled={staffingPage === 1}
                                onClick={() => setStaffingPage(p => Math.max(1, p - 1))}
                                style={{ border: 'none', background: 'none', cursor: staffingPage === 1 ? 'not-allowed' : 'pointer', color: staffingPage === 1 ? '#cbd5e1' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Page {staffingPage} of {totalStaffingPages}</span>
                            <button 
                                disabled={staffingPage === totalStaffingPages}
                                onClick={() => setStaffingPage(p => Math.min(totalStaffingPages, p + 1))}
                                style={{ border: 'none', background: 'none', cursor: staffingPage === totalStaffingPages ? 'not-allowed' : 'pointer', color: staffingPage === totalStaffingPages ? '#cbd5e1' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
