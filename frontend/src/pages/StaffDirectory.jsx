import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Download, UserPlus, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";

// Use the same CSS as Secretary Dashboard for consistency
import "../styles/SecretaryDashboard.css";
// Plus some extra styling for the Director's premium look
import "../styles/DirectorDashboard.css";

export default function StaffDirectory() {
    const navigate = useNavigate();
    const [nurses, setNurses] = useState([]);
    const [loading, setLoading] = useState(true);

    // search and filters
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        job_title: "",
        unit: "",
        status: ""
    });

    useEffect(() => {
        fetch("http://localhost:4000/api/nurses")
            .then(res => res.json())
            .then(data => {
                setNurses(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Selection options
    const jobTitles = [...new Set(nurses.map(n => n.job_title).filter(Boolean))];
    const units = [...new Set(nurses.map(n => n.unit).filter(Boolean))];
    const statuses = [...new Set(nurses.map(n => n.status).filter(Boolean))];

    const filteredNurses = nurses.filter(n =>
        (!filters.job_title || n.job_title === filters.job_title) &&
        (!filters.unit || n.unit === filters.unit) &&
        (!filters.status || n.status === filters.status) &&
        (
            n.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            n.national_id_iqama?.includes(search)
        )
    );

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("KFHU Staff Directory Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = filteredNurses.map(n => [
            n.full_name,
            n.national_id_iqama,
            n.job_title,
            n.unit,
            n.status
        ]);

        autoTable(doc, {
            startY: 40,
            head: [["Name", "Iqama/ID", "Job Title", "Unit", "Status"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [74, 106, 133] }
        });

        doc.save("kfhu_staff_directory.pdf");
    };

    return (
        <Layout
            role="director"
            logoSrc="/logo.png"
            username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Director"}
        >
            <div className="main" style={{ padding: '0 20px' }}>
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
                        <h2 style={{ fontSize: '28px', color: '#2c3e50', margin: 0 }}>Staff Directory</h2>
                    </div>
                    <button className="btn-pill" style={{ background: 'var(--accent-blue)', color: 'white', padding: '10px 20px', gap: '8px' }} onClick={generatePDF}>
                        <FileText size={18} />
                        Export Directory PDF
                    </button>
                </div>

                {/* Stats Summary Area */}
                <div className="cards-row" style={{ marginBottom: '30px', display: 'flex', gap: '20px' }}>
                    <div className="wave-card glass-card" style={{ flex: 1, minWidth: '200px' }}>
                        <p>Total Staff</p>
                        <h1>{nurses.length}</h1>
                    </div>
                    <div className="wave-card glass-card" style={{ flex: 1, minWidth: '200px' }}>
                        <p>Search Results</p>
                        <h1>{filteredNurses.length}</h1>
                    </div>
                    <div className="wave-card glass-card danger-text" style={{ flex: 1, minWidth: '200px' }}>
                        <p>Expired Licenses</p>
                        <h1>{nurses.filter(n => n.status === "EOC").length}</h1>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="table-box" style={{ marginBottom: '30px', padding: '20px' }}>
                    <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-pill"
                                style={{ paddingLeft: '40px', width: '100%' }}
                            />
                        </div>

                        <select
                            className="input-pill"
                            value={filters.job_title}
                            onChange={(e) => setFilters(prev => ({ ...prev, job_title: e.target.value }))}
                        >
                            <option value="">All Job Titles</option>
                            {jobTitles.map(j => <option key={j}>{j}</option>)}
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
                        <h2 className="content-box-title">Nursing Staff Detailed Information</h2>
                    </div>

                    <div className="custom-table" style={{ marginTop: '20px' }}>
                        <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1fr' }}>
                            <span>Name</span>
                            <span>Iqama / ID</span>
                            <span>Job Title</span>
                            <span>Unit</span>
                            <span>Status</span>
                        </div>
                        <div className="table-body">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#8ea2b5' }}>Loading staff data...</div>
                            ) : filteredNurses.length > 0 ? filteredNurses.map((nurse) => (
                                <div
                                    key={nurse.user_id}
                                    className="table-row premium-row"
                                    style={{ gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1fr', cursor: 'pointer', marginBottom: '8px' }}
                                    onClick={() => navigate(`/nurse/${nurse.user_id}`)}
                                >
                                    <span style={{ fontWeight: 800, color: '#2c3e50' }}>{nurse.full_name}</span>
                                    <span style={{ color: '#5a738e' }}>{nurse.national_id_iqama}</span>
                                    <span>{nurse.job_title}</span>
                                    <span>{nurse.unit}</span>
                                    <span className={`status ${nurse.status?.toLowerCase().replace(" ", "-")}`} style={{ width: 'fit-content' }}>
                                        {nurse.status}
                                    </span>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#8ea2b5' }}>No staff members found matching your criteria.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
