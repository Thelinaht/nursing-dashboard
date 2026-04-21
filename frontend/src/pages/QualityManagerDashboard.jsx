import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/QualityManagerDashboard.css";
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

const MOCK = {
    kpis: [
        { label: "Infection Rate (CLABSI)", value: "1.2", unit: "per 1000 pt days", trend: "up", note: "↑ vs last quarter" },
        { label: "Patient Falls", value: "0.8", unit: "per 1000 pt days", trend: "down", note: "↓ 20% improvement" },
        { label: "Medication Errors", value: "1,234", unit: "this quarter", trend: "up", note: "↑ vs last quarter" },
        { label: "Pressure Ulcers", value: "0.3%", unit: "prevalence rate", trend: "down", note: "↓ improving" },
        { label: "Staff Satisfaction", value: "80%", unit: "overall score", trend: "down", note: "↑ vs 50% last year" },
    ],
    infectionChart: {
        labels: ["CLABSI", "CAUTI", "SSI"],
        datasets: [{
            data: [1200, 900, 2313],
            backgroundColor: ["#b8cad8", "#9fb3cc", "#5a6f87"],
            borderRadius: 6,
        }]
    },
    fallsChart: {
        labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
        datasets: [
            {
                label: "Actual",
                data: [3.2, 2.8, 2.1, 1.6, 1.1, 0.8],
                borderColor: "#5a6f87",
                backgroundColor: "rgba(90,111,135,0.12)",
                tension: 0.4, fill: true, pointRadius: 4,
            },
            {
                label: "Target",
                data: [3.0, 2.5, 2.0, 1.5, 1.0, 0.7],
                borderColor: "#9fb3cc",
                borderDash: [5, 5],
                tension: 0.4, fill: false, pointRadius: 0,
            }
        ]
    },
    medErrChart: {
        labels: ["Wrong Patient", "Wrong Med", "Wrong Dose", "Wrong Time", "Other"],
        datasets: [{
            data: [30, 25, 20, 15, 10],
            backgroundColor: ["#5a6f87", "#9fb3cc", "#b8cad8", "#dce6f2", "#c8d9ed"],
            borderWidth: 0,
        }]
    },
    pressureChart: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [
            { label: "2025", data: [45, 60, 55, 80, 70, 65, 75], backgroundColor: "#5a6f87", borderRadius: 4 },
            { label: "2024", data: [50, 70, 65, 90, 80, 75, 85], backgroundColor: "#dce6f2", borderRadius: 4 },
        ]
    },
    satisfaction: [
        { label: "Overall", value: 80, color: "#5a6f87" },
        { label: "Communication", value: 76, color: "#5a6f87" },
        { label: "Workload", value: 62, color: "#e67e22" },
        { label: "Leadership", value: 85, color: "#27ae60" },
        { label: "Recognition", value: 70, color: "#5a6f87" },
    ],
    compliance: [
        { name: "BLS", pct: 98, status: "green" },
        { name: "ACLS", pct: 91, status: "green" },
        { name: "PALS", pct: 78, status: "amber" },
        { name: "NRP", pct: 72, status: "amber" },
        { name: "Fire Safety", pct: 95, status: "green" },
        { name: "Infection Control", pct: 61, status: "red" },
    ]
};

const chartOpts = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#5a6f87" } },
        y: { grid: { color: "rgba(90,111,135,0.1)" }, ticks: { font: { size: 11 }, color: "#5a6f87" } }
    }
});

const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: { legend: { display: false } }
};

export default function QualityManagerDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");

    // Staffing calculator state
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

    return (
        <Layout role="qualityManager" logoSrc="/logo.png" username={user?.full_name || "Quality Manager"}>
            <div className="qm-container">

                {/* Header */}
                <div className="qm-header">
                    <div>
                        <h1>Quality Manager Dashboard</h1>
                        <p>Nursing Manager for Quality · Mock Data Q1 2025</p>
                    </div>
                    <div className="qm-tabs">
                        {["overview", "satisfaction", "compliance", "staffing"].map(t => (
                            <button key={t} className={`qm-tab ${activeTab === t ? "active" : ""}`}
                                onClick={() => setActiveTab(t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="kpi-grid">
                    {MOCK.kpis.map(k => (
                        <div key={k.label} className="kpi-card">
                            <p className="kpi-label">{k.label}</p>
                            <h2 className="kpi-value">{k.value}</h2>
                            <p className="kpi-unit">{k.unit}</p>
                            <p className={`kpi-note ${k.trend === "up" ? "note-up" : "note-down"}`}>{k.note}</p>
                        </div>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="charts-grid">
                        <div className="chart-card">
                            <p className="chart-title">Infection rates by type</p>
                            <div style={{ height: 200 }}>
                                <Bar data={MOCK.infectionChart} options={chartOpts()} />
                            </div>
                        </div>
                        <div className="chart-card">
                            <p className="chart-title">Patient fall rates (2020–2025)</p>
                            <div className="legend-row">
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#5a6f87" }}></span>Actual</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#9fb3cc" }}></span>Target</span>
                            </div>
                            <div style={{ height: 175 }}>
                                <Line data={MOCK.fallsChart} options={chartOpts()} />
                            </div>
                        </div>
                        <div className="chart-card">
                            <p className="chart-title">Medication error types</p>
                            <div className="legend-row">
                                {MOCK.medErrChart.labels.map((l, i) => (
                                    <span key={l} className="legend-item">
                                        <span className="legend-dot" style={{ background: MOCK.medErrChart.datasets[0].backgroundColor[i] }}></span>
                                        {l}
                                    </span>
                                ))}
                            </div>
                            <div style={{ height: 160 }}>
                                <Doughnut data={MOCK.medErrChart} options={doughnutOpts} />
                            </div>
                        </div>
                        <div className="chart-card">
                            <p className="chart-title">Pressure ulcer rates by month</p>
                            <div className="legend-row">
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#5a6f87" }}></span>2025</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#dce6f2" }}></span>2024</span>
                            </div>
                            <div style={{ height: 175 }}>
                                <Bar data={MOCK.pressureChart} options={chartOpts()} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Satisfaction Tab */}
                {activeTab === "satisfaction" && (
                    <div className="chart-card" style={{ marginTop: 0 }}>
                        <p className="chart-title">Staff satisfaction scores</p>
                        <div className="sat-list">
                            {MOCK.satisfaction.map(s => (
                                <div key={s.label} className="sat-row">
                                    <span className="sat-label">{s.label}</span>
                                    <div className="sat-bar-bg">
                                        <div className="sat-bar" style={{ width: s.value + "%", background: s.color }}></div>
                                    </div>
                                    <span className="sat-val">{s.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Compliance Tab */}
                {activeTab === "compliance" && (
                    <div className="chart-card" style={{ marginTop: 0 }}>
                        <p className="chart-title">Certification compliance</p>
                        <div className="compliance-list">
                            {MOCK.compliance.map(c => (
                                <div key={c.name} className="compliance-row">
                                    <span className="compliance-name">{c.name}</span>
                                    <div className="compliance-bar-bg">
                                        <div className="compliance-bar" style={{
                                            width: c.pct + "%",
                                            background: c.status === "green" ? "#27ae60" : c.status === "amber" ? "#e67e22" : "#e74c3c"
                                        }}></div>
                                    </div>
                                    <span className={`badge ${badgeClass(c.status)}`}>{c.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Staffing Calculator Tab */}
                {activeTab === "staffing" && (() => {
                    const { result, nursesPerShift, in3Shifts } = calcStaff();
                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Formula selector */}
                            <div className="chart-card">
                                <p className="chart-title">KFHU Customized Formula · Staffing Calculator</p>
                                <div className="staffing-tabs">
                                    {Object.entries(STAFFING_MODES).map(([key, val]) => (
                                        <button key={key}
                                            className={`staffing-tab ${staffMode === key ? "active" : ""}`}
                                            onClick={() => setStaffMode(key)}>
                                            {val.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="staffing-formula-box">
                                    {staffMode === "telford"
                                        ? <span>(nurses in 3 shifts × <strong>hrs/day</strong> × 7) ÷ <strong>48</strong></span>
                                        : <span>(nurses in 3 shifts × <strong>365</strong>) ÷ <strong>{STAFFING_MODES[staffMode].workDays}</strong></span>
                                    }
                                    <span className="formula-note">{STAFFING_MODES[staffMode].note}</span>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="chart-card">
                                <p className="chart-title">Inputs</p>
                                <div className="staffing-inputs">
                                    <div className="staffing-field">
                                        <label>Bed census</label>
                                        <input type="number" value={beds} min={1}
                                            onChange={e => setBeds(parseInt(e.target.value) || 1)} />
                                    </div>
                                    <div className="staffing-field">
                                        <label>Nurse-to-patient ratio (1:N)</label>
                                        <input type="number" value={ratio} min={1}
                                            onChange={e => setRatio(parseInt(e.target.value) || 1)} />
                                    </div>
                                    {staffMode === "telford" && (
                                        <div className="staffing-field">
                                            <label>Working hours per day</label>
                                            <input type="number" value={telfordHours} min={1}
                                                onChange={e => setTelfordHours(parseInt(e.target.value) || 8)} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Result */}
                            <div className="staffing-result">
                                <div className="result-main">
                                    <p className="result-label">Nurses needed</p>
                                    <h2 className="result-number">{result}</h2>
                                    <p className="result-unit">staff members</p>
                                </div>
                                <div className="result-breakdown">
                                    <div className="brow"><span>Bed census</span><span>{beds}</span></div>
                                    <div className="brow"><span>Ratio</span><span>1:{ratio}</span></div>
                                    <div className="brow"><span>Nurses / shift</span><span>{nursesPerShift}</span></div>
                                    <div className="brow"><span>Nurses in 3 shifts</span><span>{in3Shifts}</span></div>
                                    {staffMode !== "telford" && (
                                        <div className="brow"><span>Working days / year</span><span>{STAFFING_MODES[staffMode].workDays}</span></div>
                                    )}
                                </div>
                            </div>

                        </div>
                    );
                })()}

            </div>
        </Layout>
    );
}