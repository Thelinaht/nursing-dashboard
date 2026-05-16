import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, ArrowLeft, ArrowRight, Loader } from "lucide-react";
import Layout from "../components/Layout";

import "../styles/SecretaryDashboard.css";
import "../styles/DirectorDashboard.css";

export default function TrainingStaffDirectory() {
    const navigate = useNavigate();

    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrainees = async () => {
            try {
                const response = await fetch("http://localhost:4000/api/training/trainees/directory");
                const data = await response.json();
                setTrainees(data || []);
            } catch (err) {
                console.error("Error fetching trainees:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrainees();
    }, []);

    // search and filters
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        type: "",
        unit: "",
        status: ""
    });

    // Selection options
    const traineeTypes = [...new Set(trainees.map(n => n.type))].filter(Boolean);
    const units = [...new Set(trainees.map(n => n.unit || 'General'))].filter(Boolean);
    const statuses = [...new Set(trainees.map(n => n.status))].filter(Boolean);

    const filteredTrainees = trainees.filter(n =>
        (!filters.type || n.type === filters.type) &&
        (!filters.unit || (n.unit || 'General') === filters.unit) &&
        (!filters.status || n.status === filters.status) &&
        (
            n.name?.toLowerCase().includes(search.toLowerCase()) ||
            n.university?.toLowerCase().includes(search.toLowerCase())
        )
    );

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("KFHU Training Staff Directory", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = filteredTrainees.map(n => [
            n.name,
            n.university || "N/A",
            n.type || "N/A",
            n.unit || "General",
            n.status || "N/A"
        ]);

        autoTable(doc, {
            startY: 40,
            head: [["Name", "University", "Trainee Type", "Unit", "Status"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [74, 106, 133] }
        });

        doc.save("kfhu_training_staff_directory.pdf");
    };

    const user = JSON.parse(sessionStorage.getItem("user")) || {};

    return (
        <Layout
            role="trainingDirector"
            logoSrc="/logo.png"
            username={user.full_name || "Training Director"}
        >
            <div className="main" style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="icon-btn-small" onClick={() => navigate(-1)} title="Back">
                                <ArrowLeft size={18} />
                            </button>
                            <button className="icon-btn-small" onClick={() => navigate(1)} title="Forward">
                                <ArrowRight size={18} />
                            </button>
                        </div>
                        <h2 style={{ fontSize: '28px', color: '#2c3e50', margin: 0 }}>Training Staff Directory</h2>
                    </div>
                    <button className="btn-pill" style={{ background: 'var(--accent-blue)', color: 'white', padding: '10px 20px', gap: '8px' }} onClick={generatePDF}>
                        <FileText size={18} />
                        Export Directory PDF
                    </button>
                </div>

                {/* Stats Summary Area */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Loader className="spin" size={32} color="var(--accent-blue)" />
                        <p>Loading directory data...</p>
                    </div>
                ) : (
                    <>
                        <div className="cards-row" style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            <div className="wave-card glass-card" style={{ background: '#e1f5fe', border: '1px solid rgba(41, 182, 246, 0.3)' }}>
                                <p style={{ color: '#0277bd' }}>Total Trainees</p>
                                <h1 style={{ color: '#0277bd' }}>{trainees.length}</h1>
                            </div>
                            <div className="wave-card glass-card" style={{ background: '#e8f5e9', border: '1px solid rgba(102, 187, 106, 0.3)' }}>
                                <p style={{ color: '#2e7d32' }}>Search Results</p>
                                <h1 style={{ color: '#2e7d32' }}>{filteredTrainees.length}</h1>
                            </div>
                            <div className="wave-card glass-card" style={{ background: '#f3e5f5', border: '1px solid rgba(171, 71, 188, 0.3)' }}>
                                <p style={{ color: '#6a1b9a' }}>IAU Interns</p>
                                <h1 style={{ color: '#6a1b9a' }}>{trainees.filter(n => n.type === "IAU Intern").length}</h1>
                            </div>
                        </div>

                        {/* Filters Section */}
                <div className="table-box" style={{ marginBottom: '30px', padding: '20px' }}>
                    <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search by name or university..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-pill"
                                style={{ paddingLeft: '40px', width: '100%' }}
                            />
                        </div>

                        <select
                            className="input-pill"
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="">All Trainee Types</option>
                            {traineeTypes.map(t => <option key={t}>{t}</option>)}
                        </select>

                        <select
                            className="input-pill"
                            value={filters.unit}
                            onChange={(e) => setFilters(prev => ({ ...prev, unit: e.target.value }))}
                        >
                            <option value="">All Units</option>
                            {units.map(u => <option key={u}>{u}</option>)}
                        </select>

                        <select
                            className="input-pill"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            {statuses.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Staff List Table */}
                <div className="table-box content-box">
                    <div className="box-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '15px' }}>
                        <h2 className="content-box-title">Trainee Roster</h2>
                    </div>

                    <div className="custom-table" style={{ marginTop: '20px' }}>
                        <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr' }}>
                            <span>Name</span>
                            <span>University</span>
                            <span>Trainee Type</span>
                            <span>Unit</span>
                            <span>Status</span>
                        </div>
                        <div className="table-body">
                            {filteredTrainees.length > 0 ? filteredTrainees.map((trainee) => (
                                <div
                                    key={trainee.id}
                                    className="table-row premium-row"
                                    style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr', marginBottom: '8px' }}
                                >
                                    <span style={{ fontWeight: 800, color: '#2c3e50' }}>{trainee.name}</span>
                                    <span style={{ color: '#5a738e' }}>{trainee.university || "-"}</span>
                                    <span>{trainee.type || "-"}</span>
                                    <span>{trainee.unit || "General"}</span>
                                    <span className={`status ${trainee.status === 'Completed' ? 'approved' : trainee.status === 'Pending' ? 'pending' : 'approved'}`} style={{ width: 'fit-content' }}>
                                        {trainee.status || "Active"}
                                    </span>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#8ea2b5' }}>No trainees found matching your criteria.</div>
                            )}
                        </div>
                    </div>
                </div>
                </>
                )}
            </div>
        </Layout>
    );
}
