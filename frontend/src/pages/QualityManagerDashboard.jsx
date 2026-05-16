
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // kept for potential nav use
import Layout from "../components/Layout";
import "../styles/QualityManagerDashboard.css";
import { Activity, ArrowDown, AlertTriangle, AlertCircle, Star, Calculator } from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PALETTE  (derived from design-system.css + QualityManagerDashboard.css)
//
//  Background family:  #eef1f5  →  #dce6f2  →  #c8d9ed
//  Slate spectrum:
//    S1  #1e293b   darkest  (--text-primary)
//    S2  #2f3e55   dark     (headers, strong)
//    S3  #4a6480   mid-dark
//    S4  #5a6f87   mid      (--text-secondary, axis labels)
//    S5  #7a91a8   mid-light
//    S6  #9cb5cb   light
//    S7  #b8cede   lightest swatch
//  Chart BG:  #dce6f2
//
//  Semantic (compliance only – kept because colour = meaning):
//    green  #16a34a   amber  #d97706   red  #dc2626
// ─────────────────────────────────────────────────────────────────────────────
const P = {
    s1: "#1e293b",
    s2: "#2f3e55",
    s3: "#4a6480",
    s4: "#5a6f87",
    s5: "#7a91a8",
    s6: "#9cb5cb",
    s7: "#b8cede",
    chartBg: "#dce6f2",
    // compliance semantic colours – unchanged because colour = meaning
    green: "#16a34a",
    amber: "#d97706",
    red: "#dc2626",
};

const transparentBg = {
    id: "transparentBg",
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext("2d");
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = P.chartBg;
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    },
};
ChartJS.register(transparentBg);

const MOCK = {
    kpis: [
        { label: "Infection Rate (CLABSI)", value: "1.2", theme: { Icon: Activity } },
        { label: "Patient Falls", value: "0.8", theme: { Icon: ArrowDown } },
        { label: "Medication Errors", value: "1,234", theme: { Icon: AlertCircle } },
        { label: "Pressure Ulcers", value: "0.3%", theme: { Icon: AlertTriangle } },
        { label: "Staff Satisfaction", value: "80%", theme: { Icon: Star } },
    ],

    // 1 ── Infection rates by type (Bar, 3 bars)
    //      Three distinct slate stops so each bar reads clearly
    infectionChart: {
        labels: ["CLABSI", "CAUTI", "SSI"],
        datasets: [{
            data: [1200, 900, 2313],
            backgroundColor: [P.s2, P.s5, P.s7],
            borderRadius: 6,
        }],
    },

    // 2 ── Patient fall rates 2020–2025 (Line, 2 series)
    //      Actual = darkest slate, area-filled; Target = lighter slate, dashed
    fallsChart: {
        labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
        datasets: [
            {
                label: "Actual",
                data: [3.2, 2.8, 2.1, 1.6, 1.1, 0.8],
                borderColor: P.s2,
                backgroundColor: "rgba(47,62,85,0.13)",
                pointBackgroundColor: P.s2,
                tension: 0.4, fill: true, pointRadius: 4,
            },
            {
                label: "Target",
                data: [3.0, 2.5, 2.0, 1.5, 1.0, 0.7],
                borderColor: P.s6,
                borderDash: [5, 5],
                tension: 0.4, fill: false, pointRadius: 0,
            },
        ],
    },

    // 3 ── Medication error types (Doughnut, 5 segments)
    //      Full slate ramp S2 → S7 for clear segment differentiation
    medErrChart: {
        labels: ["Wrong Patient", "Wrong Med", "Wrong Dose", "Wrong Time", "Other"],
        datasets: [{
            data: [30, 25, 20, 15, 10],
            backgroundColor: [P.s2, P.s3, P.s5, P.s6, P.s7],
            borderWidth: 0,
        }],
    },

    // 4 ── Pressure ulcer rates by month (Grouped Bar, 2 series)
    //      2025 (current year) = dark slate; 2024 (prior year) = light slate
    pressureChart: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [
            { label: "2025", data: [45, 60, 55, 80, 70, 65, 75], backgroundColor: P.s2, borderRadius: 4 },
            { label: "2024", data: [50, 70, 65, 90, 80, 75, 85], backgroundColor: P.s6, borderRadius: 4 },
        ],
    },

    // 5 ── Staff satisfaction scores (horizontal bars)
    //      Shade encodes value: highest score → darkest; lowest → lightest
    satisfaction: [
        { label: "Overall", value: 80, color: P.s3 },
        { label: "Communication", value: 76, color: P.s4 },
        { label: "Workload", value: 62, color: P.s6 },   // lowest  → lightest
        { label: "Leadership", value: 85, color: P.s2 },   // highest → darkest
        { label: "Recognition", value: 70, color: P.s5 },
    ],

    // 6 ── Certification compliance (horizontal bars)
    //      Semantic green/amber/red KEPT — colour communicates clinical meaning
    compliance: [
        { name: "BLS", pct: 98, status: "green" },
        { name: "ACLS", pct: 91, status: "green" },
        { name: "PALS", pct: 78, status: "amber" },
        { name: "NRP", pct: 72, status: "amber" },
        { name: "Fire Safety", pct: 95, status: "green" },
        { name: "Infection Control", pct: 61, status: "red" },
    ],
};

// ── Shared Chart.js options ───────────────────────────────────────────────────
const chartOpts = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        title: { display: false },
        transparentBg: {},
        tooltip: {
            backgroundColor: P.s1,
            titleColor: "#ffffff",
            bodyColor: "rgba(255,255,255,0.82)",
            cornerRadius: 8,
            padding: 10,
        },
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: P.s4 },
        },
        y: {
            grid: { color: "rgba(90,111,135,0.1)" },
            ticks: { font: { size: 11 }, color: P.s4 },
        },
    },
});

const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
        legend: { display: false },
        transparentBg: {},
        tooltip: {
            backgroundColor: P.s1,
            titleColor: "#ffffff",
            bodyColor: "rgba(255,255,255,0.82)",
            cornerRadius: 8,
            padding: 10,
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function QualityManagerDashboard() {
    const navigate = useNavigate();

    const [staffMode, setStaffMode] = useState("kfhu_expat_1off");
    const [beds, setBeds] = useState(20);
    const [ratio, setRatio] = useState(4);
    const [telfordHours, setTelfordHours] = useState(8);

    const STAFFING_MODES = {
        kfhu_expat_1off: { workDays: 248, label: "Expat 8h · 1 day off", note: "365 − 45 − 20 − 52 = 248" },
        kfhu_expat_2off: { workDays: 196, label: "Expat 8h · 2 days off", note: "365 − 45 − 20 − 104 = 196" },
        kfhu_expat_12h: { workDays: 144, label: "Expat 12h · 3 days off", note: "365 − 45 − 20 − 156 = 144" },
        kfhu_saudi_8h: { workDays: 205, label: "Saudi 8h · 2 days off", note: "365 − 36 − 20 − 104 = 205" },
        kfhu_saudi_12h: { workDays: 153, label: "Saudi 12h · 3 days off", note: "365 − 36 − 20 − 156 = 153" },
        telford: { workDays: null, label: "Telford Method", note: "(nurses × hrs × 7) ÷ 48" },
    };

    const calcStaff = () => {
        const nursesPerShift = Math.ceil(beds / ratio);
        const in3Shifts = nursesPerShift * 3;
        if (staffMode === "telford") {
            return { result: Math.ceil((in3Shifts * telfordHours * 7) / 48), nursesPerShift, in3Shifts };
        }
        const { workDays } = STAFFING_MODES[staffMode];
        return { result: Math.ceil((in3Shifts * 365) / workDays), nursesPerShift, in3Shifts };
    };

    const badgeClass = (s) => s === "green" ? "badge-green" : s === "amber" ? "badge-amber" : "badge-red";
    const complianceBarColor = (s) => s === "green" ? P.green : s === "amber" ? P.amber : P.red;

    const { result, nursesPerShift, in3Shifts } = calcStaff();

    return (
        <Layout role="qualityManager" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Quality Manager"}>
            <div className="qm-container">

                {/* ── Header (no tab buttons) ── */}
                <div className="qm-header">
                    <div><h1>Quality Manager Dashboard</h1></div>
                </div>

                {/* ── KPI cards ── */}
                <div className="kpi-grid">
                    {MOCK.kpis.map(k => {
                        const Icon = k.theme.Icon;
                        let cardClass = "blue";
                        if (k.label.toLowerCase().includes("infection")) cardClass = "blue";
                        if (k.label.toLowerCase().includes("falls")) cardClass = "green";
                        if (k.label.toLowerCase().includes("medication")) cardClass = "red";
                        if (k.label.toLowerCase().includes("pressure")) cardClass = "yellow";
                        if (k.label.toLowerCase().includes("satisfaction")) cardClass = "purple";
                        return (
                            <div key={k.label} className={`glass-card ${cardClass}`}>
                                <p><Icon size={22} /> {k.label}</p>
                                <h1>{k.value}</h1>
                                <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>{k.unit}</div>
                                <div style={{ fontSize: "12px", fontWeight: "600" }}>{k.note}</div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Row 1: charts grid (2×2) ── */}
                <div className="charts-grid">

                    {/* 1 – Infection rates by type */}
                    <div className="chart-card" style={{ background: P.chartBg, border: "none" }}>
                        <p className="chart-title">Infection rates by type</p>
                        <div className="legend-row">
                            {MOCK.infectionChart.labels.map((l, i) => (
                                <span key={l} className="legend-item">
                                    <span className="legend-dot"
                                        style={{ background: MOCK.infectionChart.datasets[0].backgroundColor[i] }} />
                                    {l}
                                </span>
                            ))}
                        </div>
                        <div style={{ height: 180 }}>
                            <Bar data={MOCK.infectionChart} options={chartOpts()} />
                        </div>
                    </div>

                    {/* 2 – Patient fall rates 2020–2025 */}
                    <div className="chart-card" style={{ background: P.chartBg, border: "none" }}>
                        <p className="chart-title">Patient fall rates (2020–2025)</p>
                        <div className="legend-row">
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: P.s2 }} />Actual
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: P.s6 }} />Target
                            </span>
                        </div>
                        <div style={{ height: 165 }}>
                            <Line data={MOCK.fallsChart} options={chartOpts()} />
                        </div>
                    </div>

                    {/* 3 – Medication error types */}
                    <div className="chart-card" style={{ background: P.chartBg, border: "none" }}>
                        <p className="chart-title">Medication error types</p>
                        <div className="legend-row">
                            {MOCK.medErrChart.labels.map((l, i) => (
                                <span key={l} className="legend-item">
                                    <span className="legend-dot"
                                        style={{ background: MOCK.medErrChart.datasets[0].backgroundColor[i] }} />
                                    {l}
                                </span>
                            ))}
                        </div>
                        <div style={{ height: 150 }}>
                            <Doughnut data={MOCK.medErrChart} options={doughnutOpts} />
                        </div>
                    </div>

                    {/* 4 – Pressure ulcer rates by month */}
                    <div className="chart-card" style={{ background: P.chartBg, border: "none" }}>
                        <p className="chart-title">Pressure ulcer rates by month</p>
                        <div className="legend-row">
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: P.s2 }} />2025
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: P.s6 }} />2024
                            </span>
                        </div>
                        <div style={{ height: 165 }}>
                            <Bar data={MOCK.pressureChart} options={chartOpts()} />
                        </div>
                    </div>

                </div>

                {/* ── Row 2: satisfaction + compliance side by side ── */}
                <div className="charts-grid">

                    {/* 5 – Staff satisfaction scores */}
                    <div className="chart-card" style={{ background: P.chartBg, border: "none" }}>
                        <p className="chart-title">Staff satisfaction scores</p>
                        <div className="sat-list">
                            {MOCK.satisfaction.map(s => (
                                <div key={s.label} className="sat-row">
                                    <span className="sat-label">{s.label}</span>
                                    <div className="sat-bar-bg">
                                        <div className="sat-bar" style={{ width: s.value + "%", background: s.color }} />
                                    </div>
                                    <span className="sat-val">{s.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6 – Certification compliance */}
                    <div className="chart-card" style={{ background: P.chartBg, border: "none" }}>
                        <p className="chart-title">Certification compliance</p>
                        <div className="compliance-list">
                            {MOCK.compliance.map(c => (
                                <div key={c.name} className="compliance-row">
                                    <span className="compliance-name">{c.name}</span>
                                    <div className="compliance-bar-bg">
                                        <div className="compliance-bar"
                                            style={{ width: c.pct + "%", background: complianceBarColor(c.status) }} />
                                    </div>
                                    <span className={`badge ${badgeClass(c.status)}`}>{c.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Row 3: Staffing Calculator — Director style ── */}
                <div className="chart-card" style={{ background: P.chartBg, border: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <Calculator size={18} color={P.s2} />
                        <p className="chart-title" style={{ margin: 0 }}>Staffing Requirement Calculator</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                        {/* Input: nurses in 3 shifts */}
                        <div className="input-group">
                            <label style={{ fontSize: 13, color: P.s4, marginBottom: 8, display: "block" }}>
                                Nurses Needed in 24H (Sum of 3 shifts)
                            </label>
                            <input
                                type="number"
                                value={in3Shifts}
                                min={1}
                                onChange={e => {
                                    // back-calculate beds from nurses in 3 shifts
                                    const n = parseInt(e.target.value) || 1;
                                    setBeds(Math.ceil((n / 3) * ratio));
                                }}
                                className="input-pill"
                                style={{ width: "100%" }}
                            />
                        </div>

                        {/* Select: formula */}
                        <div className="input-group">
                            <label style={{ fontSize: 13, color: P.s4, marginBottom: 8, display: "block" }}>
                                Calculation Formula / Method
                            </label>
                            <select
                                value={staffMode}
                                onChange={e => setStaffMode(e.target.value)}
                                className="input-pill"
                                style={{ width: "100%" }}
                            >
                                {Object.entries(STAFFING_MODES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Telford extra input */}
                        {staffMode === "telford" && (
                            <div className="input-group">
                                <label style={{ fontSize: 13, color: P.s4, marginBottom: 8, display: "block" }}>
                                    Working hours per day
                                </label>
                                <input
                                    type="number"
                                    value={telfordHours}
                                    min={1}
                                    onChange={e => setTelfordHours(parseInt(e.target.value) || 8)}
                                    className="input-pill"
                                    style={{ width: "100%" }}
                                />
                            </div>
                        )}

                        {/* Result area */}
                        <div className="calc-result-area">
                            <span style={{ fontSize: 14, fontWeight: 500, color: P.s3 }}>Total Staff Required:</span>
                            <div style={{ marginTop: 5, display: "flex", alignItems: "baseline", gap: 5 }}>
                                <span style={{ fontSize: 36, fontWeight: 700, color: P.s2 }}>{result}</span>
                                <span style={{ fontSize: 14, color: P.s5 }}>Nurses</span>
                            </div>
                            <p style={{ fontSize: 11, color: "#888", marginTop: 10, fontStyle: "italic" }}>
                                *Based on hospital standard actual working days and leave policy.
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </Layout>
    );
}