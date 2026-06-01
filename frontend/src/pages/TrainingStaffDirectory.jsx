import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, BookOpen, Filter, ChevronDown, Loader, X, Edit } from "lucide-react";
import Layout from "../components/Layout";

import "../styles/SecretaryDashboard.css";
import "../styles/DirectorDashboard.css";

const TRAINEE_TYPES = ["Intern", "Student Nurse"];
const STATUS_OPTIONS = ["Active", "Pending", "Completed", "Rejected"];

const emptyForm = {
    name: "",
    university: "",
    program: "Intern",
    unit: "",
    status: "Active",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    gender: ""
};

export default function TrainingStaffDirectory() {
    const navigate = useNavigate();

    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hospitalUnits, setHospitalUnits] = useState([]);

    // ── Add Trainee Modal state ──
    const [showModal, setShowModal] = useState(false);
    const [editingTraineeId, setEditingTraineeId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const fetchTrainees = async () => {
        setLoading(true);
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

    const fetchUnits = async () => {
        try {
            const response = await fetch("http://localhost:4000/api/training/units");
            const data = await response.json();
            setHospitalUnits(data.map(u => u.unit_name) || []);
        } catch (err) {
            console.error("Error fetching units:", err);
        }
    };

    useEffect(() => {
        fetchTrainees();
        fetchUnits();
    }, []);

    // ── Search & Filters ──
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("az");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ type: "", unit: "", status: "", year: "", month: "", gender: "", university: "" });

    const traineeTypes = [...new Set(trainees.map(n => n.type))].filter(Boolean);
    const units = [...new Set(trainees.map(n => n.unit || "Unassigned"))].filter(Boolean);
    const statuses = [...new Set(trainees.map(n => n.status))].filter(Boolean);
    const years = [...new Set(trainees.map(n => n.startDate ? n.startDate.split("-")[0] : null))].filter(Boolean).sort((a, b) => b - a);
    const universities = [...new Set(trainees.map(n => n.university))].filter(Boolean).sort();

    const filteredTrainees = trainees
        .filter(n =>
            (!filters.type || n.type === filters.type) &&
            (!filters.unit || (n.unit || "Unassigned") === filters.unit) &&
            (!filters.status || n.status === filters.status) &&
            (!filters.gender || n.gender === filters.gender) &&
            (!filters.university || n.university === filters.university) &&
            (!filters.year || (n.startDate && n.startDate.startsWith(filters.year))) &&
            (!filters.month || (n.startDate && n.startDate.split("-")[1] === filters.month)) &&
            (
                n.name?.toLowerCase().includes(search.toLowerCase()) ||
                n.university?.toLowerCase().includes(search.toLowerCase())
            )
        )
        .sort((a, b) => {
            const nameA = a.name?.toLowerCase() || "";
            const nameB = b.name?.toLowerCase() || "";
            return sortOrder === "az" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const activeFilterCount = Object.values(filters).filter(v => v !== "").length;
    const clearAll = () => { setFilters({ type: "", unit: "", status: "", year: "", month: "", gender: "", university: "" }); setSearch(""); };

    // ── Stats ──
    const isIAU = (u) => u?.toLowerCase().includes("iau") || u?.toLowerCase().includes("imam abdulrahman");
    // IAU = any trainee (Intern or Student Nurse) from IAU university
    const iauInterns    = trainees.filter(n => isIAU(n.university)).length;
    // Non-IAU Interns = Interns from non-IAU universities
    const nonIauInterns = trainees.filter(n => n.type === "Intern" && !isIAU(n.university)).length;
    // Summer Training = Student Nurses from non-IAU universities
    const summerTrainees = trainees.filter(n => n.type === "Student Nurse" && !isIAU(n.university)).length;

    // ── PDF Export ──
    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("KFHU Training Staff Directory Report", 14, 15);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 23);
        const tableData = filteredTrainees.map(n => [
            n.name, 
            n.university || "N/A", 
            n.type || "N/A", 
            n.gender || "N/A",
            n.unit || "Unassigned", 
            n.startDate && n.endDate ? `${n.startDate} to ${n.endDate}` : n.startDate || n.endDate || "N/A",
            n.status || "N/A"
        ]);
        autoTable(doc, {
            startY: 30,
            head: [["Name", "University", "Trainee Type", "Gender", "Unit", "Training Period", "Status"]],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [74, 106, 133] }
        });
        doc.save("kfhu_training_staff_directory.pdf");
    };

    // ── Status badge class ──
    const getStatusClass = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "active") return "active";
        if (s === "completed") return "transferred";
        if (s === "pending") return "breech-of-contract";
        if (s === "rejected") return "terminated";
        return "active";
    };

    // ── Save new trainee ──
    const handleAddTrainee = async (e) => {
        e.preventDefault();
        setFormError("");
        if (!form.name.trim()) { setFormError("Full name is required."); return; }
        if (!form.university.trim()) { setFormError("University is required."); return; }
        if (!form.gender) { setFormError("Gender is required."); return; }

        setSaving(true);
        try {
            const res = await fetch("http://localhost:4000/api/training/dashboard/update-row", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "intern",
                    id: editingTraineeId || "new",
                    fields: {
                        name: form.name.trim(),
                        university: form.university.trim(),
                        program: form.program,
                        unit: form.unit,
                        status: form.status,
                        start_date: form.start_date || null,
                        end_date: form.end_date || null,
                        gender: form.gender
                    }
                })
            });
            const result = await res.json();
            if (result.success) {
                setShowModal(false);
                setForm(emptyForm);
                setEditingTraineeId(null);
                fetchTrainees();
            } else {
                setFormError(result.error || "Failed to add trainee.");
            }
        } catch (err) {
            console.error(err);
            setFormError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const user = JSON.parse(sessionStorage.getItem("user")) || {};

    return (
        <Layout
            role="trainingDirector"
            logoSrc="/logo.png"
            username={user.full_name || "Training Director"}
        >
            <div className="main">

                {/* ── Page Header ── */}
                <div className="page-header">
                    <h1>Training Staff Directory</h1>
                    <button className="add-nurse-btn" onClick={() => { setForm(emptyForm); setFormError(""); setEditingTraineeId(null); setShowModal(true); }}>
                        + Add New Trainee
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <Loader className="spin" size={36} color="var(--accent-blue)" />
                        <p style={{ marginTop: "14px", color: "var(--text-secondary)" }}>Loading directory data...</p>
                    </div>
                ) : (
                    <>
                        {/* ── KPI Cards ── */}
                        <div className="cards">
                            <div className="glass-card blue">
                                <p><Users size={20} /> Total Trainees</p>
                                <h1>{trainees.length}</h1>
                            </div>
                            <div className="glass-card" style={{ background: "rgba(107,33,168,0.08)", border: "1px solid rgba(107,33,168,0.18)" }}>
                                <p style={{ color: "#6a1b9a" }}><GraduationCap size={20} /> IAU Interns</p>
                                <h1 style={{ color: "#6a1b9a" }}>{iauInterns}</h1>
                            </div>
                            <div className="glass-card" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)" }}>
                                <p style={{ color: "#1a237e" }}><GraduationCap size={20} /> Non-IAU Interns</p>
                                <h1 style={{ color: "#1a237e" }}>{nonIauInterns}</h1>
                            </div>
                            <div className="glass-card yellow">
                                <p><BookOpen size={20} /> Summer Trainees</p>
                                <h1>{summerTrainees}</h1>
                            </div>
                        </div>

                        {/* ── Filters Section ── */}
                        <div className="filter-section">
                            <div className="filter-row">
                                <input
                                    type="text"
                                    placeholder="🔍  Search by name or university..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="search-input"
                                />
                                <button
                                    type="button"
                                    className={`filters-toggle-btn ${showFilters ? "open" : ""}`}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter size={16} />
                                    <span>Filters</span>
                                    {activeFilterCount > 0 && (
                                        <span className="filter-badge">{activeFilterCount}</span>
                                    )}
                                    <ChevronDown size={14} className={`chevron ${showFilters ? "rotated" : ""}`} />
                                </button>
                            </div>

                            {showFilters && (
                                <div className="filters-panel">
                                    <select className="filter-select" value={filters.type} onChange={(e) => handleFilterChange("type", e.target.value)}>
                                        <option value="">Trainee Type</option>
                                        {traineeTypes.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                    <select className="filter-select" value={filters.unit} onChange={(e) => handleFilterChange("unit", e.target.value)}>
                                        <option value="">Unit</option>
                                        {hospitalUnits.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                    <select className="filter-select" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                                        <option value="">Status</option>
                                        {statuses.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    <select className="filter-select" value={filters.university} onChange={(e) => handleFilterChange("university", e.target.value)}>
                                        <option value="">University</option>
                                        {universities.map(univ => <option key={univ}>{univ}</option>)}
                                    </select>
                                    <select className="filter-select" value={filters.gender} onChange={(e) => handleFilterChange("gender", e.target.value)}>
                                        <option value="">Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <select className="filter-select" value={filters.year} onChange={(e) => handleFilterChange("year", e.target.value)}>
                                        <option value="">Training Year</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select className="filter-select" value={filters.month} onChange={(e) => handleFilterChange("month", e.target.value)}>
                                        <option value="">Training Month</option>
                                        <option value="01">January</option>
                                        <option value="02">February</option>
                                        <option value="03">March</option>
                                        <option value="04">April</option>
                                        <option value="05">May</option>
                                        <option value="06">June</option>
                                        <option value="07">July</option>
                                        <option value="08">August</option>
                                        <option value="09">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                </div>
                            )}

                            <div className="filter-actions">
                                <div className="active-filters">
                                    <span className="results-count">
                                        {filteredTrainees.length} result{filteredTrainees.length !== 1 ? "s" : ""}
                                    </span>
                                    {filters.type && <span className="filter-chip">{filters.type}<button onClick={() => handleFilterChange("type", "")}>✕</button></span>}
                                    {filters.unit && <span className="filter-chip">{filters.unit}<button onClick={() => handleFilterChange("unit", "")}>✕</button></span>}
                                    {filters.status && <span className="filter-chip">{filters.status}<button onClick={() => handleFilterChange("status", "")}>✕</button></span>}
                                    {filters.university && <span className="filter-chip">University: {filters.university}<button onClick={() => handleFilterChange("university", "")}>✕</button></span>}
                                    {filters.gender && <span className="filter-chip">Gender: {filters.gender}<button onClick={() => handleFilterChange("gender", "")}>✕</button></span>}
                                    {filters.year && <span className="filter-chip">Year: {filters.year}<button onClick={() => handleFilterChange("year", "")}>✕</button></span>}
                                    {filters.month && <span className="filter-chip">Month: {filters.month}<button onClick={() => handleFilterChange("month", "")}>✕</button></span>}
                                    {(filters.type || filters.unit || filters.status || filters.gender || filters.year || filters.month || filters.university || search) && (
                                        <button className="clear-btn" onClick={clearAll}>Clear all</button>
                                    )}
                                </div>
                                <button className="report-btn" onClick={generatePDF}>Generate Report</button>
                            </div>
                        </div>

                        {/* ── Table ── */}
                        <div className="table-box content-box">
                            <div className="table-header-row">
                                <h2 className="table-title">Trainees Information</h2>
                                <select className="sort-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                    <option value="az">Sort By Name: A → Z</option>
                                    <option value="za">Sort By Name: Z → A</option>
                                </select>
                            </div>

                            <div className="list-header" style={{ gridTemplateColumns: "1.5fr 1.1fr 1.1fr 0.8fr 0.9fr 1.6fr 1.1fr 0.5fr" }}>
                                <span>Name</span>
                                <span>University</span>
                                <span>Trainee Type</span>
                                <span>Gender</span>
                                <span>Unit</span>
                                <span>Training Period</span>
                                <span>Status</span>
                                <span style={{ textAlign: "right", paddingRight: "10px" }}>Action</span>
                            </div>

                            <div className="nurses-list">
                                {filteredTrainees.length > 0 ? filteredTrainees.map((trainee) => (
                                    <div
                                        key={trainee.id}
                                        className="nurse-card premium-row"
                                        style={{ gridTemplateColumns: "1.5fr 1.1fr 1.1fr 0.8fr 0.9fr 1.6fr 1.1fr 0.5fr" }}
                                    >
                                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{trainee.name}</div>
                                        <div style={{ color: "var(--text-secondary)" }}>{trainee.university || "—"}</div>
                                        <div>{trainee.type || "—"}</div>
                                        <div style={{ color: !trainee.gender ? "#e53935" : "var(--text-secondary)", fontWeight: !trainee.gender ? 600 : "normal" }}>
                                            {trainee.gender || "—"}
                                        </div>
                                        <div style={{ color: !trainee.unit ? "#e53935" : "inherit", fontWeight: !trainee.unit ? 600 : "normal" }}>
                                            {trainee.unit || "Unassigned"}
                                        </div>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                                            {trainee.startDate && trainee.endDate 
                                                ? `${trainee.startDate} to ${trainee.endDate}` 
                                                : trainee.startDate || trainee.endDate || "—"}
                                        </span>
                                        <span className={`status ${getStatusClass(trainee.status)}`}>
                                            {trainee.status || "Active"}
                                        </span>
                                        <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "10px" }}>
                                            <button 
                                                className="icon-btn-small" 
                                                title="Edit Trainee" 
                                                style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}
                                                onClick={() => {
                                                    setEditingTraineeId(trainee.id);
                                                    setForm({
                                                        name: trainee.name || "",
                                                        university: trainee.university || "",
                                                        program: trainee.type || "Intern",
                                                        unit: trainee.unit || "",
                                                        status: trainee.status || "Active",
                                                        start_date: trainee.startDate ? trainee.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
                                                        end_date: trainee.endDate ? trainee.endDate.split("T")[0] : "",
                                                        gender: trainee.gender || ""
                                                    });
                                                    setFormError("");
                                                    setShowModal(true);
                                                }}
                                            >
                                                <Edit size={14} color="var(--accent-blue)" />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                                        No trainees found matching your criteria.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Add New Trainee Modal ── */}
            {showModal && (
                <div
                    style={{
                        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
                        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(4px)"
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            background: "white", borderRadius: "16px", width: "520px", maxWidth: "92%",
                            padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                            maxHeight: "90vh", overflowY: "auto"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text-primary)", fontWeight: 700 }}>
                                    {editingTraineeId ? "Edit Trainee" : "Add New Trainee"}
                                </h2>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                                    {editingTraineeId ? "Update details for the trainee" : "Fill in the details to register a new trainee"}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%",
                                    width: "36px", height: "36px", cursor: "pointer", display: "flex",
                                    alignItems: "center", justifyContent: "center", transition: "background 0.2s"
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddTrainee} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                            {/* Full Name */}
                            <div>
                                <label style={labelStyle}>Full Name <span style={{ color: "#e53935" }}>*</span></label>
                                <input
                                    type="text"
                                    className="search-input"
                                    style={inputStyle}
                                    placeholder="e.g. Noura Al-Sudairi"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            {/* University */}
                            <div>
                                <label style={labelStyle}>University <span style={{ color: "#e53935" }}>*</span></label>
                                <input
                                    type="text"
                                    className="search-input"
                                    style={inputStyle}
                                    placeholder="e.g. Imam Abdulrahman Bin Faisal University"
                                    value={form.university}
                                    onChange={e => setForm(p => ({ ...p, university: e.target.value }))}
                                />
                            </div>

                            {/* Trainee Type + Unit */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={labelStyle}>Trainee Type</label>
                                    <select
                                        className="search-input"
                                        style={inputStyle}
                                        value={form.program}
                                        onChange={e => setForm(p => ({ ...p, program: e.target.value }))}
                                    >
                                        {TRAINEE_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Unit</label>
                                    <select
                                        className="search-input"
                                        style={inputStyle}
                                        value={form.unit}
                                        onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                                    >
                                        <option value="">Unassigned</option>
                                        {hospitalUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Status & Gender */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select
                                        className="search-input"
                                        style={inputStyle}
                                        value={form.status}
                                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Gender</label>
                                    <select
                                        className="search-input"
                                        style={inputStyle}
                                        value={form.gender}
                                        onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            {/* Start Date + End Date */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={labelStyle}>Start Date</label>
                                    <input
                                        type="date"
                                        className="search-input"
                                        style={inputStyle}
                                        value={form.start_date}
                                        onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>End Date</label>
                                    <input
                                        type="date"
                                        className="search-input"
                                        style={inputStyle}
                                        value={form.end_date}
                                        onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Error message */}
                            {formError && (
                                <div style={{
                                    background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.25)",
                                    borderRadius: "10px", padding: "10px 14px", color: "#c62828", fontSize: "13px"
                                }}>
                                    {formError}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)",
                                        background: "white", cursor: "pointer", fontSize: "14px",
                                        fontWeight: 600, color: "var(--text-secondary)", transition: "background 0.2s"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="add-nurse-btn"
                                    style={{ padding: "10px 28px", fontSize: "14px", opacity: saving ? 0.7 : 1 }}
                                >
                                    {saving ? "Saving..." : (editingTraineeId ? "Save Changes" : "Add Trainee")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--text-secondary)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.4px"
};

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 0
};
