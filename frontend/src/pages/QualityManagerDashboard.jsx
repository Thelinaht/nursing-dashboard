import { useState, useMemo, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import "../styles/QualityManagerDashboard.css";
import {
    AlertTriangle, Activity, Pill, TrendingUp,
    Plus, Pencil, Trash2, X, Filter, Eye
} from "lucide-react";
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const API = "http://localhost:4000/api";

// ============================================================
// Constants
// ============================================================
const UNITS = ["ER", "MICU", "SICU", "PICU", "NICU", "CCU", "2D", "3B", "3C", "3D", "4A", "4B", "4C", "4D", "4E", "5A", "5B", "E3", "E4"];

const FALL_SUB_LOCATIONS = ["Pt. room", "Bathroom", "Hallway", "Others"];
const FALL_INJURIES = ["None", "Minor", "Major"];
const FALL_FACTORS = ["Loss balance", "Dizziness", "Wet floor", "Pt. gen. condition", "Post Procedure", "Unattended"];

const HAPI_STAGES = ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Unstageable", "SDTPI"];
const HAPI_CAUSES = ["Immobility", "Device related", "Moisture"];
const HAPI_SITES = ["Sacral", "Heel", "Buttocks", "Occiput", "Scapular", "Wrist", "Multiple", "Other"];

const MED_TYPES = [
    "MAR not double checked", "Charting Errors", "Order Misread",
    "Medication Label Misread", "Medication Overlooked", "Incorrect Calculation",
    "Medication not double-checked", "Wrong patient", "Wrong dose"
];

const COLORS = {
    // Slate blue palette — matches system design
    dark: "#2f3e55",   // darkest navy (primary bars)
    mid: "#5a7a96",   // medium slate
    light: "#8fa8be",   // lighter slate
    pale: "#bdd1e0",   // pale blue
    ghost: "#dce8f0",   // almost white blue
    // Accents
    teal: "#0d9488",
    indigo: "#4f46e5",
    red: "#dc2626",
    // Legacy
    s2: "#2f3e55",
    b1: "#2f3e55",
};
const PIE_COLORS = ["#2f3e55", "#4a6a87", "#6b8fa8", "#8fb3c8", "#b3ceda", "#0d9488", "#4f46e5"];

// Empty form templates — use DB column names directly
const EMPTY_FALL = {
    ReferenceID: "", URN: "", IncidentDate: "", TimeofFI: "", Age: "",
    Gender: "Male", Location: "", IncidentSubLocation: "",
    InjurySustained: "", Fall: "", ContributoryFactors: "", Description: ""
};
const EMPTY_HAPI = {
    ReferenceID: "", URN: "", IncidentDate: "", IncidentSubLocation: "",
    Stage: "Stage 1", AffectedSite: "", ContributoryFactors: "", Description: ""
};
const EMPTY_MED = {
    URN: "", Date: "", Unit: "", Type: "MAR not double checked", Description: ""
};

// Mock medication data (no DB table yet)

// ============================================================
// Main Component
// ============================================================
export default function QualityManagerDashboard() {
    // Data state
    const [falls, setFalls] = useState([]);
    const [hapis, setHapis] = useState([]);
    const [meds, setMeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Period filter
    const [period, setPeriod] = useState("annual");
    const [year, setYear] = useState(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

    // Modal
    const [activeModal, setActiveModal] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);


    // ─── Fetch from API ───────────────────────────────────────
    const fetchFalls = useCallback(async () => {
        try {
            const res = await fetch(`${API}/quality/falls`);
            if (!res.ok) throw new Error("Failed to fetch falls");
            const data = await res.json();
            setFalls(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("fetchFalls:", err);
            setError("Could not load fall incidents.");
        }
    }, []);

    const fetchHapi = useCallback(async () => {
        try {
            const res = await fetch(`${API}/quality/hapi`);
            if (!res.ok) throw new Error("Failed to fetch HAPI");
            const data = await res.json();
            setHapis(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("fetchHapi:", err);
            setError("Could not load HAPI records.");
        }
    }, []);

    const fetchMeds = useCallback(async () => {
        try {
            const res = await fetch(`${API}/quality/meds`);
            if (!res.ok) throw new Error("Failed to fetch meds");
            const data = await res.json();
            setMeds(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("fetchMeds:", err);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchFalls(), fetchHapi(), fetchMeds()]).finally(() => setLoading(false));
    }, [fetchFalls, fetchHapi, fetchMeds]);

    // ─── Period filter ────────────────────────────────────────
    // Parses date safely — avoids UTC timezone shift from MySQL DATE strings
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const str = dateStr instanceof Date ? dateStr.toISOString() : String(dateStr);
        const [y, m] = str.split("T")[0].split("-").map(Number);
        if (!y || !m) return null;
        return { y, m };
    };

    const matchesPeriod = (dateStr) => {
        const parsed = parseLocalDate(dateStr);
        if (!parsed) return false;
        if (year !== null && parsed.y !== year) return false;
        if (year === null) return true; // All Years — skip month/quarter filter
        if (period === "monthly") return parsed.m === month;
        if (period === "quarterly") return Math.ceil(parsed.m / 3) === quarter;
        return true;
    };

    const visibleFalls = useMemo(() => falls.filter(f => matchesPeriod(f.IncidentDate)), [falls, period, year, month, quarter]);
    const visibleHapis = useMemo(() => hapis.filter(h => matchesPeriod(h.IncidentDate)), [hapis, period, year, month, quarter]);
    const visibleMeds = useMemo(() => meds.filter(m => matchesPeriod(m.Date)), [meds, period, year, month, quarter]);

    // ─── KPI stats ────────────────────────────────────────────
    const stats = {
        totalFalls: visibleFalls.length,
        fallWithInjury: visibleFalls.filter(f => f.Fall === "Fall with Injury").length,
        fallWithoutInjury: visibleFalls.filter(f => f.Fall === "Fall without injury").length,
        totalHapi: visibleHapis.length,
        totalMeds: visibleMeds.length,
    };

    // ─── Chart data ───────────────────────────────────────────
    const fallsByInjury = useMemo(() => {
        const counts = { None: 0, Minor: 0, Major: 0 };
        visibleFalls.forEach(f => { if (f.InjurySustained) counts[f.InjurySustained] = (counts[f.InjurySustained] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [visibleFalls]);

    const fallsByUnit = useMemo(() => {
        const counts = {};
        visibleFalls.forEach(f => { if (f.Location) counts[f.Location] = (counts[f.Location] || 0) + 1; });
        return Object.entries(counts).map(([unit, count]) => ({ unit, count })).sort((a, b) => b.count - a.count);
    }, [visibleFalls]);

    const fallsByFactor = useMemo(() => {
        const counts = {};
        visibleFalls.forEach(f => { if (f.ContributoryFactors) counts[f.ContributoryFactors] = (counts[f.ContributoryFactors] || 0) + 1; });
        const arr = Object.entries(counts).map(([factor, count]) => ({ factor, count })).sort((a, b) => b.count - a.count);
        const total = arr.reduce((s, x) => s + x.count, 0);
        let cum = 0;
        return arr.map(x => { cum += x.count; return { ...x, cumulative: total ? Math.round((cum / total) * 100) : 0 }; });
    }, [visibleFalls]);

    const fallsTrend = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const counts = Array(12).fill(0);
        const targetYear = year ?? new Date().getFullYear();
        falls.forEach(f => {
            const parsed = parseLocalDate(f.IncidentDate);
            if (parsed && parsed.y === targetYear) counts[parsed.m - 1]++;
        });
        return months.map((m, i) => ({ month: m, count: counts[i] }));
    }, [falls, year]);

    const hapiByStage = useMemo(() => {
        const counts = {};
        visibleHapis.forEach(h => { if (h.Stage) counts[h.Stage] = (counts[h.Stage] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [visibleHapis]);

    const hapiByCause = useMemo(() => {
        const counts = {};
        visibleHapis.forEach(h => { if (h.ContributoryFactors) counts[h.ContributoryFactors] = (counts[h.ContributoryFactors] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [visibleHapis]);

    const hapiBySite = useMemo(() => {
        const counts = {};
        visibleHapis.forEach(h => { if (h.AffectedSite) counts[h.AffectedSite] = (counts[h.AffectedSite] || 0) + 1; });
        return Object.entries(counts).map(([site, count]) => ({ site, count })).sort((a, b) => b.count - a.count);
    }, [visibleHapis]);

    const medsByType = useMemo(() => {
        const counts = {};
        visibleMeds.forEach(m => counts[m.Type] = (counts[m.Type] || 0) + 1);
        return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
    }, [visibleMeds]);

    const medsByUnit = useMemo(() => {
        const counts = {};
        visibleMeds.forEach(m => counts[m.Unit] = (counts[m.Unit] || 0) + 1);
        return Object.entries(counts).map(([unit, count]) => ({ unit, count })).sort((a, b) => b.count - a.count);
    }, [visibleMeds]);

    // ─── CRUD handlers ────────────────────────────────────────
    const openAdd = (kind) => { setEditingItem(null); setActiveModal(kind); };
    const openEdit = (kind, item) => { setEditingItem(item); setActiveModal(kind); };
    const openView = (kind, item) => { setViewingItem({ kind, item }); };
    const closeModal = () => { setActiveModal(null); setEditingItem(null); };
    const closeView = () => setViewingItem(null);

    const saveFall = async (form) => {
        const isEdit = !!editingItem;
        const url = isEdit
            ? `${API}/quality/falls/${editingItem.ReferenceID}`
            : `${API}/quality/falls`;
        try {
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || `HTTP ${res.status}`);
            }
            await fetchFalls();
            closeModal();
        } catch (err) {
            console.error("saveFall error:", err);
            alert("Error saving fall incident:\n" + err.message);
        }
    };

    const saveHapi = async (form) => {
        const isEdit = !!editingItem;
        const url = isEdit
            ? `${API}/quality/hapi/${editingItem.ReferenceID}`
            : `${API}/quality/hapi`;
        try {
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Save failed");
            await fetchHapi();
            closeModal();
        } catch (err) {
            alert("Error saving HAPI record: " + err.message);
        }
    };

    const saveMed = async (form) => {
        const isEdit = !!editingItem;
        const url = isEdit
            ? `${API}/quality/meds/${editingItem.URN}`
            : `${API}/quality/meds`;
        try {
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
            await fetchMeds();
            closeModal();
        } catch (err) {
            alert("Error saving medication incident:\n" + err.message);
        }
    };

    const deleteFall = async (id) => {
        if (!confirm("Delete this fall incident?")) return;
        try {
            await fetch(`${API}/quality/falls/${id}`, { method: "DELETE" });
            await fetchFalls();
        } catch (err) {
            alert("Error deleting record: " + err.message);
        }
    };

    const deleteHapi = async (id) => {
        if (!confirm("Delete this HAPI record?")) return;
        try {
            await fetch(`${API}/quality/hapi/${id}`, { method: "DELETE" });
            await fetchHapi();
        } catch (err) {
            alert("Error deleting record: " + err.message);
        }
    };

    const deleteMed = async (urn) => {
        if (!confirm("Delete this medication incident?")) return;
        try {
            await fetch(`${API}/quality/meds/${urn}`, { method: "DELETE" });
            await fetchMeds();
        } catch (err) {
            alert("Error deleting record: " + err.message);
        }
    };

    // Robustly parse any datetime string — handles UTC Z strings, plain strings, Date objects
    const smartFormatDate = (d, showTime = false) => {
        if (!d) return "—";
        const s = String(d);
        const pad = n => String(n).padStart(2, "0");

        // If string has Z or timezone offset → parse as UTC then display local time
        if (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) {
            const date = new Date(s);
            if (isNaN(date.getTime())) return "—";
            const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
            if (showTime) {
                const h = date.getHours(), min = date.getMinutes();
                if (h !== 0 || min !== 0) return `${dateStr} ${pad(h)}:${pad(min)}`;
            }
            return dateStr;
        }

        // No timezone indicator — parse directly (no conversion)
        const clean = s.replace(" ", "T");
        const [datePart, timePart] = clean.split("T");
        if (!datePart || datePart.length < 10) return "—";
        const [y, m, day] = datePart.split("-");
        if (!y || !m || !day) return "—";
        const dateStr = `${day}/${m}/${y}`;
        if (showTime && timePart) {
            const time = timePart.slice(0, 5);
            if (time && time !== "00:00") return `${dateStr} ${time}`;
        }
        return dateStr;
    };

    const formatDate = (d) => smartFormatDate(d, false);

    const MONTHS = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // Derive year list from actual records in DB
    const availableYears = useMemo(() => {
        const yearSet = new Set();
        falls.forEach(f => { const p = parseLocalDate(f.IncidentDate); if (p) yearSet.add(p.y); });
        hapis.forEach(h => { const p = parseLocalDate(h.IncidentDate); if (p) yearSet.add(p.y); });
        meds.forEach(m => { const p = parseLocalDate(m.Date); if (p) yearSet.add(p.y); });
        // Only show years that have actual records
        return [...yearSet].sort((a, b) => b - a);
    }, [falls, hapis, meds]);

    if (loading) {
        return (
            <Layout role="qualityManager" username={JSON.parse(sessionStorage.getItem("user") || "{}")?.full_name || "Quality Manager"}>
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading quality data…</div>
            </Layout>
        );
    }

    return (
        <Layout role="qualityManager" username={JSON.parse(sessionStorage.getItem("user") || "{}")?.full_name || "Quality Manager"}>
            <div className="qd-main">

                {/* ── Header ── */}
                <div className="qd-page-header">
                    <h1>Quality Manager Dashboard</h1>
                    {error && <p style={{ color: COLORS.red, fontSize: 13, marginTop: 6 }}>⚠ {error}</p>}
                </div>

                {/* ── Period Filter Bar ── */}
                <div className="qd-period-bar">
                    <div className="qd-period-group">
                        <Filter size={16} />
                        <span className="qd-period-label">Period:</span>
                        <div className="qd-period-tabs">
                            {["monthly", "quarterly", "annual"].map(p => (
                                <button key={p} className={`qd-period-tab ${period === p ? "active" : ""}`}
                                    onClick={() => setPeriod(p)}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="qd-period-selectors">
                        <select className="qd-period-select" value={year ?? "all"} onChange={e => setYear(e.target.value === "all" ? null : Number(e.target.value))}>
                            <option value="all">All Years</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {period === "monthly" && (
                            <select className="qd-period-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        )}
                        {period === "quarterly" && (
                            <select className="qd-period-select" value={quarter} onChange={e => setQuarter(Number(e.target.value))}>
                                {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* ── KPI Cards ── */}
                <div className="qd-cards">
                    <div className="glass-card red qd-falls-card">
                        <div className="qd-falls-header">
                            <AlertTriangle size={18} />
                            <span>Total Falls</span>
                        </div>
                        <div className="qd-falls-total" style={{ textAlign: "center" }}>{stats.totalFalls}</div>
                        <div className="qd-falls-split">
                            <div className="qd-falls-split-item">
                                <span className="qd-falls-num">{stats.fallWithInjury}</span>
                                <span className="qd-falls-label">With Injury</span>
                            </div>
                            <div className="qd-falls-divider" />
                            <div className="qd-falls-split-item">
                                <span className="qd-falls-num">{stats.fallWithoutInjury}</span>
                                <span className="qd-falls-label">Without Injury</span>
                            </div>
                        </div>
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
                            <p className="qd-section-sub">{visibleFalls.length} record{visibleFalls.length !== 1 ? "s" : ""} for the selected period &nbsp;·&nbsp; {falls.length} total in DB</p>
                        </div>
                        <button className="qd-add-btn" onClick={() => openAdd("fall")}>
                            <Plus size={16} /> Add Fall Incident
                        </button>
                    </div>

                    <div className="qd-table-wrap">
                        <table className="qd-table">
                            <thead>
                                <tr>
                                    <th>Date</th><th>URN</th><th>Unit</th><th>Sub-Location</th>
                                    <th>Age</th><th>Gender</th><th>Injury</th><th>Factor</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleFalls.length === 0 ? (
                                    <tr><td colSpan={9} className="qd-empty">No fall incidents in this period.</td></tr>
                                ) : visibleFalls.map(f => (
                                    <tr key={f.ReferenceID}>
                                        <td>{formatDate(f.IncidentDate)}</td>
                                        <td>{f.URN || "—"}</td>
                                        <td>{f.Location || "—"}</td>
                                        <td>{f.IncidentSubLocation || "—"}</td>
                                        <td>{f.Age || "—"}</td>
                                        <td>{f.Gender ? f.Gender.charAt(0) : "—"}</td>
                                        <td>
                                            <span className={`qd-badge qd-injury-${(f.InjurySustained || "none").toLowerCase()}`}>
                                                {f.InjurySustained || "—"}
                                            </span>
                                        </td>
                                        <td className="qd-td-clip">{f.ContributoryFactors || "—"}</td>
                                        <td className="qd-actions">
                                            <button className="qd-icon-btn qd-view" onClick={() => openView("fall", f)}><Eye size={13} /></button>
                                            <button className="qd-icon-btn" onClick={() => openEdit("fall", f)}><Pencil size={13} /></button>
                                            <button className="qd-icon-btn qd-danger" onClick={() => deleteFall(f.ReferenceID)}><Trash2 size={13} /></button>
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
                                        <Pie data={fallsByInjury} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
                                        <Bar dataKey="count" fill={COLORS.dark} radius={[4, 4, 0, 0]} />
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
                                    <Line type="monotone" dataKey="count" stroke={COLORS.dark} strokeWidth={2.5} dot={{ r: 4 }} />
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
                                        <Bar yAxisId="left" dataKey="count" fill={COLORS.dark} radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke={COLORS.mid} strokeWidth={2} dot={{ r: 3 }} />
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
                                    <th>Site</th><th>Cause (Factors)</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleHapis.length === 0 ? (
                                    <tr><td colSpan={7} className="qd-empty">No pressure injuries in this period.</td></tr>
                                ) : visibleHapis.map(h => (
                                    <tr key={h.ReferenceID}>
                                        <td>{formatDate(h.IncidentDate)}</td>
                                        <td>{h.URN || "—"}</td>
                                        <td>{h.IncidentSubLocation || "—"}</td>
                                        <td><span className="qd-badge qd-stage">{h.Stage || "—"}</span></td>
                                        <td>{h.AffectedSite || "—"}</td>
                                        <td className="qd-td-clip">{h.ContributoryFactors || "—"}</td>
                                        <td className="qd-actions">
                                            <button className="qd-icon-btn qd-view" onClick={() => openView("hapi", h)}><Eye size={13} /></button>
                                            <button className="qd-icon-btn" onClick={() => openEdit("hapi", h)}><Pencil size={13} /></button>
                                            <button className="qd-icon-btn qd-danger" onClick={() => deleteHapi(h.ReferenceID)}><Trash2 size={13} /></button>
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
                                        <Pie data={hapiByStage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {hapiByStage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="qd-chart-card">
                            <h3>HAPI by Contributory Factors</h3>
                            {hapiByCause.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={hapiByCause} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {hapiByCause.map((_, i) => <Cell key={i} fill={[COLORS.dark, COLORS.mid, COLORS.pale][i % 3]} />)}
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
                                        <Bar dataKey="count" fill={COLORS.mid} radius={[4, 4, 0, 0]} />
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
                                    <th>Date</th><th>URN</th><th>Unit</th><th>Type</th><th>Description</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleMeds.length === 0 ? (
                                    <tr><td colSpan={6} className="qd-empty">No medication incidents in this period.</td></tr>
                                ) : visibleMeds.map(m => (
                                    <tr key={m.URN}>
                                        <td>{formatDate(m.Date)}</td>
                                        <td>{m.URN}</td>
                                        <td>{m.Unit}</td>
                                        <td><span className="qd-badge qd-med-type">{m.Type}</span></td>
                                        <td className="qd-td-clip">{m.Description}</td>
                                        <td className="qd-actions">
                                            <button className="qd-icon-btn qd-view" onClick={() => openView("med", m)}><Eye size={13} /></button>
                                            <button className="qd-icon-btn" onClick={() => openEdit("med", m)}><Pencil size={13} /></button>
                                            <button className="qd-icon-btn qd-danger" onClick={() => deleteMed(m.URN)}><Trash2 size={13} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="qd-charts-grid">
                        <div className="qd-chart-card">
                            <h3>Medication Incidents by Type</h3>
                            {medsByType.length === 0 ? <div className="qd-chart-empty">No data</div> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={medsByType} layout="vertical" margin={{ top: 10, right: 20, left: 70, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(90,111,135,0.1)" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <YAxis type="category" dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={140} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={COLORS.dark} radius={[0, 4, 4, 0]} />
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
                                        <Bar dataKey="count" fill={COLORS.mid} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Modals ── */}
                {activeModal === "fall" && (
                    <FallModal
                        initial={editingItem || EMPTY_FALL}
                        onSave={saveFall}
                        onClose={closeModal}
                        editing={!!editingItem}
                    />
                )}
                {activeModal === "hapi" && (
                    <HapiModal
                        initial={editingItem || EMPTY_HAPI}
                        onSave={saveHapi}
                        onClose={closeModal}
                        editing={!!editingItem}
                    />
                )}
                {activeModal === "med" && (
                    <MedModal
                        initial={editingItem || EMPTY_MED}
                        onSave={saveMed}
                        onClose={closeModal}
                        editing={!!editingItem}
                    />
                )}
                {viewingItem && (
                    <ViewModal
                        kind={viewingItem.kind}
                        item={viewingItem.item}
                        onClose={closeView}
                    />
                )}
            </div>
        </Layout>
    );
}

// ============================================================
// Fall Modal — all fields free-text, only date is a picker
// ============================================================
function FallModal({ initial, onSave, onClose, editing }) {
    const [form, setForm] = useState({ ...EMPTY_FALL, ...initial });
    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
    const canSave = form.ReferenceID && form.IncidentDate;

    return (
        <div className="qd-overlay" onClick={onClose}>
            <div className="qd-modal" onClick={e => e.stopPropagation()}>
                <div className="qd-modal-header">
                    <h3>{editing ? "Edit" : "Add"} Fall Incident</h3>
                    <button className="qd-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="qd-form-grid">

                    {/* Reference ID */}
                    <div className="qd-field">
                        <label>Reference ID <span className="qd-req">*</span></label>
                        <input
                            className="qd-input"
                            type="text"
                            placeholder="e.g. 1001"
                            value={form.ReferenceID}
                            onChange={e => set("ReferenceID", e.target.value)}
                            disabled={editing}
                        />
                    </div>

                    {/* URN */}
                    <div className="qd-field">
                        <label>URN</label>
                        <input
                            className="qd-input"
                            type="text"
                            placeholder="e.g. 1705549"
                            value={form.URN}
                            onChange={e => set("URN", e.target.value)}
                        />
                    </div>

                    {/* Incident Date — date picker */}
                    <div className="qd-field">
                        <label>Incident Date <span className="qd-req">*</span></label>
                        <input
                            className="qd-input"
                            type="date"
                            value={form.IncidentDate ? form.IncidentDate.split("T")[0] : ""}
                            onChange={e => set("IncidentDate", e.target.value)}
                        />
                    </div>

                    {/* Time of FI */}
                    <div className="qd-field">
                        <label>Time of Fall</label>
                        <input
                            className="qd-input"
                            type="time"
                            value={form.TimeofFI}
                            onChange={e => set("TimeofFI", e.target.value)}
                        />
                    </div>

                    {/* Age */}
                    <div className="qd-field">
                        <label>Age</label>
                        <input
                            className="qd-input"
                            type="text"
                            placeholder="e.g. 57"
                            value={form.Age}
                            onChange={e => set("Age", e.target.value)}
                        />
                    </div>

                    {/* Gender */}
                    <div className="qd-field">
                        <label>Gender</label>
                        <select
                            className="qd-input"
                            value={form.Gender}
                            onChange={e => set("Gender", e.target.value)}
                        >
                            <option value="">— Select —</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                    {/* Location (unit/ward) */}
                    <div className="qd-field">
                        <label>Location (Unit/Ward)</label>
                        <input
                            className="qd-input"
                            type="text"
                            placeholder="e.g. ER, 3C, MICU"
                            value={form.Location}
                            onChange={e => set("Location", e.target.value)}
                        />
                    </div>

                    {/* IncidentSubLocation */}
                    <div className="qd-field">
                        <label>Incident Sub-Location</label>
                        <input
                            className="qd-input"
                            type="text"
                            placeholder="e.g. Bathroom, Hallway, Others"
                            value={form.IncidentSubLocation}
                            onChange={e => set("IncidentSubLocation", e.target.value)}
                        />
                    </div>

                    {/* Injury Sustained — dropdown */}
                    <div className="qd-field">
                        <label>Injury Sustained</label>
                        <select
                            className="qd-input"
                            value={form.InjurySustained}
                            onChange={e => set("InjurySustained", e.target.value)}
                        >
                            <option value="">— Select —</option>
                            <option value="Major">Major</option>
                            <option value="Minor">Minor</option>
                            <option value="None">None</option>
                        </select>
                    </div>

                    {/* Fall — dropdown */}
                    <div className="qd-field">
                        <label>Fall</label>
                        <select
                            className="qd-input"
                            value={form.Fall}
                            onChange={e => set("Fall", e.target.value)}
                        >
                            <option value="">— Select —</option>
                            <option value="Fall with Injury">Fall with Injury</option>
                            <option value="Fall without injury">Fall without injury</option>
                        </select>
                    </div>

                    {/* Contributory Factors */}
                    <div className="qd-field qd-full">
                        <label>Contributory Factors</label>
                        <input
                            className="qd-input"
                            type="text"
                            placeholder="e.g. Loss balance, Dizziness, Wet floor"
                            value={form.ContributoryFactors}
                            onChange={e => set("ContributoryFactors", e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="qd-field qd-full">
                        <label>Description</label>
                        <textarea
                            className="qd-input qd-textarea"
                            placeholder="Describe what happened..."
                            value={form.Description}
                            onChange={e => set("Description", e.target.value)}
                            rows={3}
                        />
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
// HAPI Modal — uses DB column names
// ============================================================
function HapiModal({ initial, onSave, onClose, editing }) {
    const [form, setForm] = useState({ ...EMPTY_HAPI, ...initial });
    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const AFFECTED_SITES = ["Sacral", "Heel", "Buttocks", "Occiput", "Scapular", "Wrist", "Multiple"];
    const CONTRIB_FACTORS = ["Immobility", "Device related", "Moisture"];

    // Explicit flags — true when "Other" is selected
    const [affectedOther, setAffectedOther] = useState(
        !!initial?.AffectedSite && !AFFECTED_SITES.includes(initial.AffectedSite)
    );
    const [contribOther, setContribOther] = useState(
        !!initial?.ContributoryFactors && !CONTRIB_FACTORS.includes(initial.ContributoryFactors)
    );

    const handleAffectedSite = (val) => {
        if (val === "Other") {
            setAffectedOther(true);
            set("AffectedSite", "");
        } else {
            setAffectedOther(false);
            set("AffectedSite", val);
        }
    };

    const handleContrib = (val) => {
        if (val === "Other") {
            setContribOther(true);
            set("ContributoryFactors", "");
        } else {
            setContribOther(false);
            set("ContributoryFactors", val);
        }
    };

    const affectedDropVal = affectedOther ? "Other" : form.AffectedSite;
    const contribDropVal = contribOther ? "Other" : form.ContributoryFactors;

    const canSave = form.ReferenceID && form.IncidentDate && form.Stage;

    return (
        <div className="qd-overlay" onClick={onClose}>
            <div className="qd-modal" onClick={e => e.stopPropagation()}>
                <div className="qd-modal-header">
                    <h3>{editing ? "Edit" : "Add"} Pressure Injury</h3>
                    <button className="qd-close-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="qd-form-grid">

                    {/* Reference ID */}
                    <div className="qd-field">
                        <label>Reference ID <span className="qd-req">*</span></label>
                        <input className="qd-input" type="text" placeholder="e.g. 2001"
                            value={form.ReferenceID}
                            onChange={e => set("ReferenceID", e.target.value)}
                            disabled={editing} />
                    </div>

                    {/* URN */}
                    <div className="qd-field">
                        <label>URN</label>
                        <input className="qd-input" value={form.URN}
                            onChange={e => set("URN", e.target.value)} placeholder="Patient URN" />
                    </div>

                    {/* Unit — free text */}
                    <div className="qd-field">
                        <label>Unit</label>
                        <input className="qd-input" type="text" placeholder="e.g. ER, MICU, 3C"
                            value={form.IncidentSubLocation}
                            onChange={e => set("IncidentSubLocation", e.target.value)} />
                    </div>

                    {/* Date & Time */}
                    <div className="qd-field">
                        <label>Date & Time <span className="qd-req">*</span></label>
                        <input type="datetime-local" className="qd-input"
                            value={form.IncidentDate
                                ? String(form.IncidentDate).replace(" ", "T").slice(0, 16)
                                : ""}
                            onChange={e => set("IncidentDate", e.target.value)} />
                    </div>

                    {/* Stage */}
                    <div className="qd-field">
                        <label>Stage <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.Stage}
                            onChange={e => set("Stage", e.target.value)}>
                            {["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Unstageable", "SDTPI"].map(s => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Affected Site */}
                    <div className="qd-field">
                        <label>Affected Site</label>
                        <select className="qd-input" value={affectedDropVal}
                            onChange={e => handleAffectedSite(e.target.value)}>
                            <option value="">— Select —</option>
                            {AFFECTED_SITES.map(s => <option key={s}>{s}</option>)}
                            <option value="Other">Other</option>
                        </select>
                        {affectedOther && (
                            <input className="qd-input" style={{ marginTop: 6 }}
                                type="text" placeholder="Please specify..."
                                value={form.AffectedSite}
                                onChange={e => set("AffectedSite", e.target.value)}
                                autoFocus />
                        )}
                    </div>

                    {/* Contributory Factors */}
                    <div className="qd-field">
                        <label>Contributory Factors</label>
                        <select className="qd-input" value={contribDropVal}
                            onChange={e => handleContrib(e.target.value)}>
                            <option value="">— Select —</option>
                            {CONTRIB_FACTORS.map(c => <option key={c}>{c}</option>)}
                            <option value="Other">Other</option>
                        </select>
                        {contribOther && (
                            <input className="qd-input" style={{ marginTop: 6 }}
                                type="text" placeholder="Please specify..."
                                value={form.ContributoryFactors}
                                onChange={e => set("ContributoryFactors", e.target.value)}
                                autoFocus />
                        )}
                    </div>

                    {/* Description */}
                    <div className="qd-field qd-full">
                        <label>Description</label>
                        <textarea className="qd-input qd-textarea" value={form.Description}
                            onChange={e => set("Description", e.target.value)} rows={3} />
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
// Medication Modal — mock only (no DB table yet)
// ============================================================
function MedModal({ initial, onSave, onClose, editing }) {
    const [form, setForm] = useState(initial);
    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
    const canSave = form.URN && form.Date && form.Type;

    return (
        <div className="qd-overlay" onClick={onClose}>
            <div className="qd-modal" onClick={e => e.stopPropagation()}>
                <div className="qd-modal-header">
                    <h3>{editing ? "Edit" : "Add"} Medication Incident</h3>
                    <button className="qd-close-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="qd-form-grid">
                    <div className="qd-field">
                        <label>URN <span className="qd-req">*</span></label>
                        <input className="qd-input" type="text" placeholder="Patient URN"
                            value={form.URN} onChange={e => set("URN", e.target.value)}
                            disabled={editing} />
                    </div>
                    <div className="qd-field">
                        <label>Unit</label>
                        <input className="qd-input" type="text" placeholder="e.g. ER, MICU, 3C"
                            value={form.Unit} onChange={e => set("Unit", e.target.value)} />
                    </div>
                    <div className="qd-field qd-full">
                        <label>Date & Time <span className="qd-req">*</span></label>
                        <input type="datetime-local" className="qd-input"
                            value={form.Date ? String(form.Date).replace(" ", "T").slice(0, 16) : ""}
                            onChange={e => set("Date", e.target.value)} />
                    </div>
                    <div className="qd-field qd-full">
                        <label>Type <span className="qd-req">*</span></label>
                        <select className="qd-input" value={form.Type} onChange={e => set("Type", e.target.value)}>
                            <option value="">— Select —</option>
                            {["MAR not double checked", "Charting Errors", "Order Misread",
                                "Medication Label Misread", "Medication Overlooked", "Incorrect Calculation",
                                "Medication not double-checked", "Wrong patient", "Wrong dose"
                            ].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="qd-field qd-full">
                        <label>Description</label>
                        <textarea className="qd-input qd-textarea" value={form.Description}
                            onChange={e => set("Description", e.target.value)} rows={3} />
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
// View Modal — read-only display of all record fields
// ============================================================
function ViewModal({ kind, item, onClose }) {
    const formatDate = (d) => {
        if (!d) return "—";
        const s = String(d);
        const pad = n => String(n).padStart(2, "0");

        // UTC string (has Z or ±HH:MM) → convert to browser local time
        if (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) {
            const date = new Date(s);
            if (isNaN(date.getTime())) return "—";
            const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
            const h = date.getHours(), min = date.getMinutes();
            if (h !== 0 || min !== 0) return `${dateStr}  ${pad(h)}:${pad(min)}`;
            return dateStr;
        }

        // Plain string (no timezone) → parse directly, no conversion
        const clean = s.replace(" ", "T");
        const [datePart, timePart] = clean.split("T");
        if (!datePart || datePart.length < 10) return "—";
        const [y, m, day] = datePart.split("-");
        if (!y || !m || !day) return "—";
        const dateStr = `${day}/${m}/${y}`;
        if (timePart) {
            const time = timePart.slice(0, 5);
            if (time && time !== "00:00") return `${dateStr}  ${time}`;
        }
        return dateStr;
    };

    const fallFields = [
        { label: "Reference ID", value: item.ReferenceID },
        { label: "URN", value: item.URN },
        { label: "Incident Date", value: formatDate(item.IncidentDate) },
        { label: "Time of Fall", value: item.TimeofFI },
        { label: "Age", value: item.Age },
        { label: "Gender", value: item.Gender },
        { label: "Location (Unit)", value: item.Location },
        { label: "Sub-Location", value: item.IncidentSubLocation },
        { label: "Injury Sustained", value: item.InjurySustained },
        { label: "Fall", value: item.Fall },
        { label: "Contributory Factors", value: item.ContributoryFactors },
        { label: "Description", value: item.Description, full: true },
    ];

    const hapiFields = [
        { label: "Reference ID", value: item.ReferenceID },
        { label: "URN", value: item.URN },
        { label: "Incident Date", value: formatDate(item.IncidentDate) },
        { label: "Unit", value: item.IncidentSubLocation },
        { label: "Stage", value: item.Stage },
        { label: "Affected Site", value: item.AffectedSite },
        { label: "Contributory Factors", value: item.ContributoryFactors },
        { label: "Description", value: item.Description, full: true },
    ];

    const medFields = [
        { label: "URN", value: item.URN },
        { label: "Unit", value: item.Unit },
        { label: "Date & Time", value: formatDate(item.Date) },
        { label: "Type", value: item.Type, full: true },
        { label: "Description", value: item.Description, full: true },
    ];

    const fields = kind === "fall" ? fallFields : kind === "hapi" ? hapiFields : medFields;
    const title = kind === "fall" ? "Fall Incident Details" : kind === "hapi" ? "Pressure Injury Details" : "Medication Incident Details";

    return (
        <div className="qd-overlay" onClick={onClose}>
            <div className="qd-modal" onClick={e => e.stopPropagation()}>
                <div className="qd-modal-header">
                    <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Eye size={18} /> {title}
                    </h3>
                    <button className="qd-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="qd-view-grid">
                    {fields.map(({ label, value, full }) => (
                        <div key={label} className={`qd-view-field${full ? " qd-full" : ""}`}>
                            <span className="qd-view-label">{label}:</span>
                            <span className="qd-view-value">{value || "—"}</span>
                        </div>
                    ))}
                </div>

                <div className="qd-modal-actions">
                    <button className="qd-cancel-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}