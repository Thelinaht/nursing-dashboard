import { useState, useMemo } from "react";
import Layout from "../components/Layout";
import "../styles/QualityManagerDashboard.css";
import {
    AlertTriangle, Activity, Pill, TrendingUp,
    Plus, Pencil, Trash2, X, Filter, Calculator
} from "lucide-react";
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ============================================================
// Constants
// ============================================================
const UNITS = ["ER", "MICU", "SICU", "PICU", "NICU", "CCU", "2D", "3B", "3C", "3D", "4A", "4B", "4C", "4D", "4E", "5A", "5B", "E3", "E4"];

const FALL_LOCATIONS = ["Pt. room", "Bathroom", "Hallway", "Others"];
const FALL_INJURIES = ["None", "Minor", "Major"];
const FALL_FACTORS = ["Loss balance", "Dizziness", "Wet floor", "Pt. gen. condition", "Post Procedure", "Unattended"];

const HAPI_STAGES = ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Unstageable", "SDTPI"];
const HAPI_CAUSES = ["Immobility", "Device related", "Moisture"];
const HAPI_SITES = ["Sacral", "Heel", "Buttocks", "Occiput", "Scapular", "Wrist", "Multiple", "Other"];

const MED_TYPES = [
    "MAR not double checked",
    "Charting Errors",
    "Order Misread",
    "Medication Label Misread",
    "Medication Overlooked",
    "Incorrect Calculation",
    "Medication not double-checked",
    "Wrong patient",
    "Wrong dose"
];

// Color palette (matches design tokens + the existing slate scheme)
const COLORS = {
    s2: "#2f3e55", s4: "#5a6f87", s5: "#7a91a8", s6: "#9cb5cb",
    red: "#dc2626", orange: "#d97706", green: "#16a34a", purple: "#7e57c2",
    blue: "#334155",
};
const PIE_COLORS = [COLORS.s2, COLORS.s5, COLORS.s6, COLORS.orange, COLORS.green, COLORS.red, COLORS.purple];

// ============================================================
// Mock data — replace with API calls when backend is ready
// ============================================================
const MOCK_FALLS = [
    { id: 1, urn: "1705549", unit: "3C", incident_date: "2026-01-15", incident_time: "2340", age: 57, gender: "M", location: "Pt. room", injury: "None", contributing_factor: "Loss balance", description: "Patient with right lower limb necrotizing fasciitis." },
    { id: 2, urn: "654641", unit: "3A", incident_date: "2026-01-22", incident_time: "2200", age: 38, gender: "M", location: "Others", injury: "None", contributing_factor: "Dizziness", description: "Patient collapsed in front of ER." },
    { id: 3, urn: "464520", unit: "2E", incident_date: "2026-02-05", incident_time: "2100", age: 70, gender: "M", location: "Pt. room", injury: "Minor", contributing_factor: "Pt. gen. condition", description: "Patient delirium, got out of bed." },
    { id: 4, urn: "2013261", unit: "2D", incident_date: "2026-02-10", incident_time: "2200", age: 38, gender: "F", location: "Pt. room", injury: "None", contributing_factor: "Dizziness", description: "Post cystoscopy, fainted." },
    { id: 5, urn: "396998", unit: "2D", incident_date: "2026-02-15", incident_time: "0400", age: 58, gender: "F", location: "Bathroom", injury: "None", contributing_factor: "Wet floor", description: "Post total knee replacement, fell after wudu." },
    { id: 6, urn: "1523551", unit: "2C", incident_date: "2026-03-08", incident_time: "0700", age: 25, gender: "F", location: "Bathroom", injury: "Minor", contributing_factor: "Dizziness", description: "Felt down in bathroom, hit nose." },
    { id: 7, urn: "2007970", unit: "ER", incident_date: "2026-03-12", incident_time: "0550", age: 42, gender: "F", location: "Bathroom", injury: "None", contributing_factor: "Dizziness", description: "Felt dizzy, fell while being assisted." },
    { id: 8, urn: "2013926", unit: "2D", incident_date: "2026-03-20", incident_time: "0900", age: 64, gender: "F", location: "Others", injury: "Major", contributing_factor: "Loss balance", description: "Fell down in MRI room." },
];

const MOCK_HAPI = [
    { id: 1, urn: "1699078", unit: "4D", incident_date: "2026-01-17", stage: "Stage 2", cause: "Immobility", site: "Sacral", outcome_intervention: "Not healed, expired", description: "Sacral sore 5cmx3cm and 3cmx2cm." },
    { id: 2, urn: "1437094", unit: "4E", incident_date: "2026-01-18", stage: "Stage 2", cause: "Immobility", site: "Sacral", outcome_intervention: "Healed", description: "Skin peeling on sacral area." },
    { id: 3, urn: "2011407", unit: "SICU", incident_date: "2026-02-16", stage: "Unstageable", cause: "Immobility", site: "Sacral", outcome_intervention: "Same stage, same size", description: "Pressure sore deteriorating to unstageable, 9x10cm." },
    { id: 4, urn: "2014145", unit: "MICU", incident_date: "2026-02-13", stage: "Stage 2", cause: "Immobility", site: "Sacral", outcome_intervention: "Same size but dry", description: "Blister at sacral area, 5cmx1cm." },
    { id: 5, urn: "1375524", unit: "MICU", incident_date: "2026-02-12", stage: "Stage 2", cause: "Immobility", site: "Heel", outcome_intervention: "Dry and healing", description: "Right heel blister, 5x6 cm." },
    { id: 6, urn: "2013277", unit: "SICU", incident_date: "2026-03-10", stage: "Stage 2", cause: "Immobility", site: "Sacral", outcome_intervention: "Same stage, increased in size", description: "Blister in sacral region." },
    { id: 7, urn: "766726", unit: "SICU", incident_date: "2026-03-06", stage: "Stage 1", cause: "Device related", site: "Heel", outcome_intervention: "Healed", description: "Skin peeling on sacral region." },
    { id: 8, urn: "1255135", unit: "PICU", incident_date: "2026-03-15", stage: "Stage 3", cause: "Immobility", site: "Buttocks", outcome_intervention: "Same stage, decreased in size", description: "Buttocks pressure injury." },
];

const MOCK_MEDS = [
    { id: 1, urn: "2006582", unit: "PICU", incident_date: "2026-01-08", incident_time: "1430", incident_type: "Wrong dose", description: "Calculation error in pediatric dose." },
    { id: 2, urn: "1683880", unit: "ER", incident_date: "2026-01-15", incident_time: "0900", incident_type: "MAR not double checked", description: "MAR not verified before administration." },
    { id: 3, urn: "654641", unit: "ER", incident_date: "2026-01-22", incident_time: "1130", incident_type: "Wrong patient", description: "Medication given to wrong patient." },
    { id: 4, urn: "1620598", unit: "PICU", incident_date: "2026-02-03", incident_time: "0800", incident_type: "Charting Errors", description: "Wrong time documented." },
    { id: 5, urn: "1479394", unit: "2A", incident_date: "2026-02-14", incident_time: "1600", incident_type: "Medication not double-checked", description: "High alert med not double-checked." },
    { id: 6, urn: "503620", unit: "MICU", incident_date: "2026-02-20", incident_time: "0700", incident_type: "Incorrect Calculation", description: "Drip rate miscalculation." },
    { id: 7, urn: "1545538", unit: "NICU", incident_date: "2026-03-05", incident_time: "0300", incident_type: "Medication Label Misread", description: "Wrong concentration read from label." },
    { id: 8, urn: "1255135", unit: "PICU", incident_date: "2026-03-18", incident_time: "1200", incident_type: "Medication Overlooked", description: "Scheduled dose missed." },
];

const EMPTY_FALL = { urn: "", unit: "", incident_date: "", incident_time: "", age: "", gender: "M", location: "Pt. room", injury: "None", contributing_factor: "", description: "" };
const EMPTY_HAPI = { urn: "", unit: "", incident_date: "", stage: "Stage 1", cause: "Immobility", site: "", outcome_intervention: "", description: "" };
const EMPTY_MED = { urn: "", unit: "", incident_date: "", incident_time: "", incident_type: "MAR not double checked", description: "" };

// ============================================================
// Staffing Calculator (preserved from original)
// ============================================================
const STAFFING_MODES = {
    kfhu_expat_1off: { workDays: 248, label: "Expat 8h · 1 day off" },
    kfhu_expat_2off: { workDays: 196, label: "Expat 8h · 2 days off" },
    kfhu_expat_12h: { workDays: 144, label: "Expat 12h · 3 days off" },
    kfhu_saudi_8h: { workDays: 205, label: "Saudi 8h · 2 days off" },
    kfhu_saudi_12h: { workDays: 153, label: "Saudi 12h · 3 days off" },
    telford: { workDays: null, label: "Telford Method" },
};

// ============================================================
// Main Component
// ============================================================
export default function QualityManagerDashboard() {
    // Data state
    const [falls, setFalls] = useState(MOCK_FALLS);
    const [hapis, setHapis] = useState(MOCK_HAPI);
    const [meds, setMeds] = useState(MOCK_MEDS);

    // Period filter
    const [period, setPeriod] = useState("annual");
    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(1);
    const [quarter, setQuarter] = useState(1);

    // Modal
    const [activeModal, setActiveModal] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // Staffing calculator state
    const [staffMode, setStaffMode] = useState("kfhu_expat_1off");
    const [in3Shifts, setIn3Shifts] = useState(15);
    const [telfordHours, setTelfordHours] = useState(8);

    // ─── Filter helper ───
    const matchesPeriod = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (d.getFullYear() !== year) return false;
        if (period === "monthly") return d.getMonth() + 1 === month;
        if (period === "quarterly") return Math.ceil((d.getMonth() + 1) / 3) === quarter;
        return true;
    };

    const visibleFalls = useMemo(() => falls.filter(f => matchesPeriod(f.incident_date)), [falls, period, year, month, quarter]);
    const visibleHapis = useMemo(() => hapis.filter(h => matchesPeriod(h.incident_date)), [hapis, period, year, month, quarter]);
    const visibleMeds = useMemo(() => meds.filter(m => matchesPeriod(m.incident_date)), [meds, period, year, month, quarter]);

    // ─── KPI stats ───
    const stats = {
        totalFalls: visibleFalls.length,
        totalFallsWithInjury: visibleFalls.filter(f => f.injury !== "None").length,
        totalHapi: visibleHapis.length,
        totalMeds: visibleMeds.length,
    };

    // ─── Chart data builders ───
    const fallsByInjury = useMemo(() => {
        const counts = { None: 0, Minor: 0, Major: 0 };
        visibleFalls.forEach(f => counts[f.injury] = (counts[f.injury] || 0) + 1);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [visibleFalls]);

    const fallsByUnit = useMemo(() => {
        const counts = {};
        visibleFalls.forEach(f => counts[f.unit] = (counts[f.unit] || 0) + 1);
        return Object.entries(counts).map(([unit, count]) => ({ unit, count })).sort((a, b) => b.count - a.count);
    }, [visibleFalls]);

    const fallsByFactor = useMemo(() => {
        const counts = {};
        visibleFalls.forEach(f => { if (f.contributing_factor) counts[f.contributing_factor] = (counts[f.contributing_factor] || 0) + 1; });
        const arr = Object.entries(counts).map(([factor, count]) => ({ factor, count })).sort((a, b) => b.count - a.count);
        const total = arr.reduce((s, x) => s + x.count, 0);
        let cum = 0;
        return arr.map(x => { cum += x.count; return { ...x, cumulative: total ? Math.round((cum / total) * 100) : 0 }; });
    }, [visibleFalls]);

    const fallsTrend = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const counts = Array(12).fill(0);
        falls.forEach(f => {
            const d = new Date(f.incident_date);
            if (d.getFullYear() === year) counts[d.getMonth()]++;
        });
        return months.map((m, i) => ({ month: m, count: counts[i] }));
    }, [falls, year]);

    const hapiByStage = useMemo(() => {
        const counts = {};
        visibleHapis.forEach(h => counts[h.stage] = (counts[h.stage] || 0) + 1);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [visibleHapis]);

    const hapiByCause = useMemo(() => {
        const counts = {};
        visibleHapis.forEach(h => counts[h.cause] = (counts[h.cause] || 0) + 1);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [visibleHapis]);

    const hapiBySite = useMemo(() => {
        const counts = {};
        visibleHapis.forEach(h => counts[h.site] = (counts[h.site] || 0) + 1);
        return Object.entries(counts).map(([site, count]) => ({ site, count })).sort((a, b) => b.count - a.count);
    }, [visibleHapis]);

    const medsByType = useMemo(() => {
        const counts = {};
        visibleMeds.forEach(m => counts[m.incident_type] = (counts[m.incident_type] || 0) + 1);
        return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
    }, [visibleMeds]);

    const medsByUnit = useMemo(() => {
        const counts = {};
        visibleMeds.forEach(m => counts[m.unit] = (counts[m.unit] || 0) + 1);
        return Object.entries(counts).map(([unit, count]) => ({ unit, count })).sort((a, b) => b.count - a.count);
    }, [visibleMeds]);

    // ─── CRUD handlers ───
    const openAdd = (kind) => { setEditingItem(null); setActiveModal(kind); };
    const openEdit = (kind, item) => { setEditingItem(item); setActiveModal(kind); };
    const closeModal = () => { setActiveModal(null); setEditingItem(null); };

    const saveItem = (kind, form) => {
        const setter = kind === "fall" ? setFalls : kind === "hapi" ? setHapis : setMeds;
        const list = kind === "fall" ? falls : kind === "hapi" ? hapis : meds;
        if (editingItem) {
            setter(prev => prev.map(x => x.id === editingItem.id ? { ...form, id: editingItem.id } : x));
        } else {
            const newId = Math.max(0, ...list.map(x => x.id)) + 1;
            setter([{ ...form, id: newId }, ...list]);
        }
        closeModal();
    };

    const deleteItem = (kind, id) => {
        if (!confirm("Are you sure you want to delete this incident?")) return;
        const setter = kind === "fall" ? setFalls : kind === "hapi" ? setHapis : setMeds;
        setter(prev => prev.filter(x => x.id !== id));
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";

    // ─── Staffing calculation ───
    const calcStaff = () => {
        const n = parseInt(in3Shifts) || 0;
        if (staffMode === "telford") return Math.ceil((n * telfordHours * 7) / 48);
        const { workDays } = STAFFING_MODES[staffMode];
        return Math.ceil((n * 365) / workDays);
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <Layout role="qualityManager" username={JSON.parse(sessionStorage.getItem("user") || "{}")?.full_name || "Quality Manager"}>
            <div className="qd-main">

                {/* ── Header ── */}
                <div className="qd-page-header">
                    <h1>Quality Manager Dashboard</h1>
                    <p className="qd-subtitle">Track nursing quality indicators across the department</p>
                </div>

                {/* ── Period Filter Bar ── */}
                <div className="qd-period-bar">
                    <div className="qd-period-group">
                        <Filter size={16} />
                        <span className="qd-period-label">Period:</span>
                        <div className="qd-period-tabs">
                            <button className={`qd-period-tab ${period === "monthly" ? "active" : ""}`} onClick={() => setPeriod("monthly")}>Monthly</button>
                            <button className={`qd-period-tab ${period === "quarterly" ? "active" : ""}`} onClick={() => setPeriod("quarterly")}>Quarterly</button>
                            <button className={`qd-period-tab ${period === "annual" ? "active" : ""}`} onClick={() => setPeriod("annual")}>Annual</button>
                        </div>
                    </div>

                    <div className="qd-period-selectors">
                        <select className="qd-period-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {period === "monthly" && (
                            <select className="qd-period-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        )}
                        {period === "quarterly" && (
                            <select className="qd-period-select" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
                                {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* ── KPI Cards ── */}
                <div className="qd-cards">
                    <div className="glass-card red">
                        <p><AlertTriangle size={20} /> Total Falls</p>
                        <h1>{stats.totalFalls}</h1>
                        <span className="qd-card-foot">{stats.totalFallsWithInjury} with injury</span>
                    </div>
                    <div className="glass-card yellow">
                        <p><Activity size={20} /> Pressure Injuries</p>
                        <h1>{stats.totalHapi}</h1>
                        <span className="qd-card-foot">HAPI cases reported</span>
                    </div>
                    <div className="glass-card purple">
                        <p><Pill size={20} /> Medication Incidents</p>
                        <h1>{stats.totalMeds}</h1>
                        <span className="qd-card-foot">across all units</span>
                    </div>
                    <div className="glass-card blue">
                        <p><TrendingUp size={20} /> Total Incidents</p>
                        <h1>{stats.totalFalls + stats.totalHapi + stats.totalMeds}</h1>
                        <span className="qd-card-foot">combined this period</span>
                    </div>
                </div>

                {/* ============================================ FALLS ============================================ */}
                <div className="qd-section">
                    <div className="qd-section-header">
                        <div>
                            <h2 className="qd-section-title">Fall Incidents</h2>
                            <p className="qd-section-sub">{visibleFalls.length} record{visibleFalls.length !== 1 ? "s" : ""} for the selected period</p>
                        </div>
                        <button className="qd-add-btn" onClick={() => openAdd("fall")}>
                            <Plus size={16} /> Add Fall Incident
                        </button>
                    </div>

                    <div className="qd-table-wrap">
                        <table className="qd-table">
                            <thead>
                                <tr>
                                    <th>Date</th><th>URN</th><th>Unit</th><th>Age</th><th>Gender</th>
                                    <th>Location</th><th>Injury</th><th>Factor</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleFalls.length === 0 ? (
                                    <tr><td colSpan={9} className="qd-empty">No fall incidents in this period.</td></tr>
                                ) : visibleFalls.map(f => (
                                    <tr key={f.id}>
                                        <td>{formatDate(f.incident_date)}</td>
                                        <td>{f.urn}</td>
                                        <td>{f.unit}</td>
                                        <td>{f.age}</td>
                                        <td>{f.gender}</td>
                                        <td>{f.location}</td>
                                        <td><span className={`qd-badge qd-injury-${f.injury.toLowerCase()}`}>{f.injury}</span></td>
                                        <td className="qd-td-clip">{f.contributing_factor}</td>
                                        <td className="qd-actions">
                                            <button className="qd-icon-btn" onClick={() => openEdit("fall", f)}><Pencil size={13} /></button>
                                            <button className="qd-icon-btn qd-danger" onClick={() => deleteItem("fall", f.id)}><Trash2 size={13} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="qd-charts-grid">
                        <div className="qd-chart-card">
                            <h3>Falls by Injury Severity</h3>
                            {fallsByInjury.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={fallsByInjury} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {fallsByInjury.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="qd-chart-card">
                            <h3>Falls by Unit</h3>
                            {fallsByUnit.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={fallsByUnit} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                        <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={COLORS.s4} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="qd-chart-card">
                            <h3>Monthly Trend ({year})</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={fallsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke={COLORS.red} strokeWidth={2.5} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="qd-chart-card">
                            <h3>Contributing Factors (Pareto)</h3>
                            {fallsByFactor.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={fallsByFactor} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                        <XAxis dataKey="factor" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar yAxisId="left" dataKey="count" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================ HAPI ============================================ */}
                <div className="qd-section">
                    <div className="qd-section-header">
                        <div>
                            <h2 className="qd-section-title">Hospital Acquired Pressure Injuries (HAPI)</h2>
                            <p className="qd-section-sub">{visibleHapis.length} record{visibleHapis.length !== 1 ? "s" : ""} for the selected period</p>
                        </div>
                        <button className="qd-add-btn" onClick={() => openAdd("hapi")}>
                            <Plus size={16} /> Add Pressure Injury
                        </button>
                    </div>

                    <div className="qd-table-wrap">
                        <table className="qd-table">
                            <thead>
                                <tr>
                                    <th>Date</th><th>URN</th><th>Unit</th><th>Stage</th>
                                    <th>Cause</th><th>Site</th><th>Outcome</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleHapis.length === 0 ? (
                                    <tr><td colSpan={8} className="qd-empty">No pressure injuries in this period.</td></tr>
                                ) : visibleHapis.map(h => (
                                    <tr key={h.id}>
                                        <td>{formatDate(h.incident_date)}</td>
                                        <td>{h.urn}</td>
                                        <td>{h.unit}</td>
                                        <td><span className="qd-badge qd-stage">{h.stage}</span></td>
                                        <td>{h.cause}</td>
                                        <td>{h.site}</td>
                                        <td className="qd-td-clip">{h.outcome_intervention}</td>
                                        <td className="qd-actions">
                                            <button className="qd-icon-btn" onClick={() => openEdit("hapi", h)}><Pencil size={13} /></button>
                                            <button className="qd-icon-btn qd-danger" onClick={() => deleteItem("hapi", h.id)}><Trash2 size={13} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="qd-charts-grid">
                        <div className="qd-chart-card">
                            <h3>HAPI by Stage</h3>
                            {hapiByStage.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={hapiByStage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {hapiByStage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="qd-chart-card">
                            <h3>HAPI by Cause (Risk Factors)</h3>
                            {hapiByCause.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={hapiByCause} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {hapiByCause.map((_, i) => <Cell key={i} fill={[COLORS.orange, COLORS.green, COLORS.s6][i % 3]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="qd-chart-card qd-chart-wide">
                            <h3>HAPI by Affected Site</h3>
                            {hapiBySite.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={hapiBySite} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                        <XAxis dataKey="site" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================ MEDICATION ============================================ */}
                <div className="qd-section">
                    <div className="qd-section-header">
                        <div>
                            <h2 className="qd-section-title">Medication Incidents</h2>
                            <p className="qd-section-sub">{visibleMeds.length} record{visibleMeds.length !== 1 ? "s" : ""} for the selected period</p>
                        </div>
                        <button className="qd-add-btn" onClick={() => openAdd("med")}>
                            <Plus size={16} /> Add Medication Incident
                        </button>
                    </div>

                    <div className="qd-table-wrap">
                        <table className="qd-table">
                            <thead>
                                <tr>
                                    <th>Date</th><th>URN</th><th>Unit</th><th>Type</th>
                                    <th>Description</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleMeds.length === 0 ? (
                                    <tr><td colSpan={6} className="qd-empty">No medication incidents in this period.</td></tr>
                                ) : visibleMeds.map(m => (
                                    <tr key={m.id}>
                                        <td>{formatDate(m.incident_date)}</td>
                                        <td>{m.urn}</td>
                                        <td>{m.unit}</td>
                                        <td><span className="qd-badge qd-med-type">{m.incident_type}</span></td>
                                        <td className="qd-td-clip">{m.description}</td>
                                        <td className="qd-actions">
                                            <button className="qd-icon-btn" onClick={() => openEdit("med", m)}><Pencil size={13} /></button>
                                            <button className="qd-icon-btn qd-danger" onClick={() => deleteItem("med", m.id)}><Trash2 size={13} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="qd-charts-grid">
                        <div className="qd-chart-card qd-chart-wide">
                            <h3>Medication Incidents by Type</h3>
                            {medsByType.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={medsByType} layout="vertical" margin={{ top: 10, right: 20, left: 70, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(90,111,135,0.1)" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <YAxis type="category" dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={140} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="qd-chart-card">
                            <h3>Medication Incidents by Unit</h3>
                            {medsByUnit.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={medsByUnit} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                        <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================ STAFFING CALCULATOR ============================================ */}
                <div className="qd-section">
                    <div className="qd-section-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Calculator size={20} color={COLORS.s2} />
                            <h2 className="qd-section-title" style={{ margin: 0 }}>Staffing Requirement Calculator</h2>
                        </div>
                    </div>

                    <div className="qd-calc-grid">
                        <div className="qd-calc-inputs">
                            <div className="qd-field">
                                <label>Nurses Needed in 24H (Sum of 3 shifts)</label>
                                <input type="number" className="qd-input" min={1} value={in3Shifts} onChange={(e) => setIn3Shifts(parseInt(e.target.value) || 1)} />
                            </div>

                            <div className="qd-field">
                                <label>Calculation Formula / Method</label>
                                <select className="qd-input" value={staffMode} onChange={(e) => setStaffMode(e.target.value)}>
                                    {Object.entries(STAFFING_MODES).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>

                            {staffMode === "telford" && (
                                <div className="qd-field">
                                    <label>Working hours per day</label>
                                    <input type="number" className="qd-input" min={1} value={telfordHours} onChange={(e) => setTelfordHours(parseInt(e.target.value) || 8)} />
                                </div>
                            )}
                        </div>

                        <div className="qd-calc-result">
                            <span className="qd-calc-label">Total Staff Required</span>
                            <div className="qd-calc-number">
                                <span className="qd-calc-big">{calcStaff()}</span>
                                <span className="qd-calc-unit">Nurses</span>
                            </div>
                            <p className="qd-calc-note">
                                *Based on hospital standard actual working days and leave policy.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Modals ── */}
                {activeModal === "fall" && <FallModal initial={editingItem || EMPTY_FALL} onSave={(form) => saveItem("fall", form)} onClose={closeModal} editing={!!editingItem} />}
                {activeModal === "hapi" && <HapiModal initial={editingItem || EMPTY_HAPI} onSave={(form) => saveItem("hapi", form)} onClose={closeModal} editing={!!editingItem} />}
                {activeModal === "med" && <MedModal initial={editingItem || EMPTY_MED} onSave={(form) => saveItem("med", form)} onClose={closeModal} editing={!!editingItem} />}

            </div>
        </Layout>
    );
}

// ============================================================
// Fall Modal
// ============================================================
function FallModal({ initial, onSave, onClose, editing }) {
    const [form, setForm] = useState(initial);
    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
    const canSave = form.urn && form.unit && form.incident_date && form.location && form.injury;

    return (
        <div className="qd-overlay" onClick={onClose}>
            <div className="qd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="qd-modal-header">
                    <h3>{editing ? "Edit" : "Add"} Fall Incident</h3>
                    <button className="qd-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="qd-form-grid">
                    <div className="qd-field">
                        <label>URN <span className="qd-req">*</span></label>
                        <input className="qd-input" value={form.urn} onChange={(e) => set("urn", e.target.value)} />
                    </div>
                    <div className="qd-field">
                        <label>Unit <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                            <option value="">Select unit</option>
                            {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="qd-field">
                        <label>Date <span className="qd-req">*</span></label>
                        <input type="date" className="qd-input" value={form.incident_date} onChange={(e) => set("incident_date", e.target.value)} />
                    </div>
                    <div className="qd-field">
                        <label>Time</label>
                        <input className="qd-input" value={form.incident_time} onChange={(e) => set("incident_time", e.target.value)} placeholder="e.g. 2340" maxLength={4} />
                    </div>
                    <div className="qd-field">
                        <label>Age</label>
                        <input type="number" className="qd-input" value={form.age} onChange={(e) => set("age", e.target.value)} />
                    </div>
                    <div className="qd-field">
                        <label>Gender</label>
                        <select className="qd-input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                    </div>
                    <div className="qd-field">
                        <label>Location <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.location} onChange={(e) => set("location", e.target.value)}>
                            {FALL_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="qd-field">
                        <label>Injury <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.injury} onChange={(e) => set("injury", e.target.value)}>
                            {FALL_INJURIES.map(i => <option key={i}>{i}</option>)}
                        </select>
                    </div>
                    <div className="qd-field qd-full">
                        <label>Contributing Factor</label>
                        <select className="qd-input" value={form.contributing_factor} onChange={(e) => set("contributing_factor", e.target.value)}>
                            <option value="">— None —</option>
                            {FALL_FACTORS.map(f => <option key={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="qd-field qd-full">
                        <label>Description</label>
                        <textarea className="qd-input qd-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
                    </div>
                </div>

                <div className="qd-modal-actions">
                    <button className="qd-cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="qd-save-btn" disabled={!canSave} onClick={() => onSave(form)}>
                        {editing ? "Save changes" : "Add incident"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// HAPI Modal
// ============================================================
function HapiModal({ initial, onSave, onClose, editing }) {
    const [form, setForm] = useState(initial);
    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
    const canSave = form.urn && form.unit && form.incident_date && form.stage && form.cause;

    return (
        <div className="qd-overlay" onClick={onClose}>
            <div className="qd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="qd-modal-header">
                    <h3>{editing ? "Edit" : "Add"} Pressure Injury</h3>
                    <button className="qd-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="qd-form-grid">
                    <div className="qd-field">
                        <label>URN <span className="qd-req">*</span></label>
                        <input className="qd-input" value={form.urn} onChange={(e) => set("urn", e.target.value)} />
                    </div>
                    <div className="qd-field">
                        <label>Unit <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                            <option value="">Select unit</option>
                            {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="qd-field">
                        <label>Date <span className="qd-req">*</span></label>
                        <input type="date" className="qd-input" value={form.incident_date} onChange={(e) => set("incident_date", e.target.value)} />
                    </div>
                    <div className="qd-field">
                        <label>Stage <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
                            {HAPI_STAGES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="qd-field">
                        <label>Cause <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.cause} onChange={(e) => set("cause", e.target.value)}>
                            {HAPI_CAUSES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="qd-field">
                        <label>Site</label>
                        <select className="qd-input" value={form.site} onChange={(e) => set("site", e.target.value)}>
                            <option value="">— Select —</option>
                            {HAPI_SITES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="qd-field qd-full">
                        <label>Outcome / Intervention</label>
                        <input className="qd-input" value={form.outcome_intervention} onChange={(e) => set("outcome_intervention", e.target.value)} placeholder="e.g. Healed, Same stage same size" />
                    </div>
                    <div className="qd-field qd-full">
                        <label>Description</label>
                        <textarea className="qd-input qd-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
                    </div>
                </div>

                <div className="qd-modal-actions">
                    <button className="qd-cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="qd-save-btn" disabled={!canSave} onClick={() => onSave(form)}>
                        {editing ? "Save changes" : "Add incident"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Medication Modal
// ============================================================
function MedModal({ initial, onSave, onClose, editing }) {
    const [form, setForm] = useState(initial);
    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
    const canSave = form.unit && form.incident_date && form.incident_type;

    return (
        <div className="qd-overlay" onClick={onClose}>
            <div className="qd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="qd-modal-header">
                    <h3>{editing ? "Edit" : "Add"} Medication Incident</h3>
                    <button className="qd-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="qd-form-grid">
                    <div className="qd-field">
                        <label>URN</label>
                        <input className="qd-input" value={form.urn} onChange={(e) => set("urn", e.target.value)} />
                    </div>
                    <div className="qd-field">
                        <label>Unit <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                            <option value="">Select unit</option>
                            {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="qd-field">
                        <label>Date <span className="qd-req">*</span></label>
                        <input type="date" className="qd-input" value={form.incident_date} onChange={(e) => set("incident_date", e.target.value)} />
                    </div>
                    <div className="qd-field">
                        <label>Time</label>
                        <input className="qd-input" value={form.incident_time} onChange={(e) => set("incident_time", e.target.value)} placeholder="e.g. 1430" maxLength={4} />
                    </div>
                    <div className="qd-field qd-full">
                        <label>Incident Type <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.incident_type} onChange={(e) => set("incident_type", e.target.value)}>
                            {MED_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="qd-field qd-full">
                        <label>Description</label>
                        <textarea className="qd-input qd-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
                    </div>
                </div>

                <div className="qd-modal-actions">
                    <button className="qd-cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="qd-save-btn" disabled={!canSave} onClick={() => onSave(form)}>
                        {editing ? "Save changes" : "Add incident"}
                    </button>
                </div>
            </div>
        </div>
    );
}