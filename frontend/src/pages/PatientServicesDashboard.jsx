import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/design-system.css";
import "../styles/PatientServicesDashboard.css";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from "recharts";
import { TrendingUp, TrendingDown, Users, AlertTriangle, Clock, Award, Activity } from "lucide-react";

// Mock Data
const outcomeData = [
    { month: "Jan", fallRate: 2.1, medErrors: 1.5, pressureInjuries: 1.1 },
    { month: "Feb", fallRate: 1.9, medErrors: 1.2, pressureInjuries: 0.9 },
    { month: "Mar", fallRate: 2.3, medErrors: 1.6, pressureInjuries: 1.0 },
    { month: "Apr", fallRate: 1.8, medErrors: 1.0, pressureInjuries: 0.7 },
    { month: "May", fallRate: 1.5, medErrors: 0.8, pressureInjuries: 0.5 },
    { month: "Jun", fallRate: 1.2, medErrors: 0.5, pressureInjuries: 0.4 },
];

const staffingData = [
    { name: "ICU", staff: 45 },
    { name: "ER", staff: 60 },
    { name: "OR", staff: 35 },
    { name: "Pediatrics", staff: 25 },
    { name: "Maternity", staff: 30 }
];

const unitSatisfaction = [
    { id: 1, unit: "Intensive Care Unit (ICU)", score: 92, trend: "up" },
    { id: 2, unit: "Emergency Room (ER)", score: 85, trend: "down" },
    { id: 3, unit: "Pediatrics", score: 96, trend: "up" },
    { id: 4, unit: "Maternity", score: 94, trend: "up" },
    { id: 5, unit: "Oncology", score: 88, trend: "down" },
];

export default function PatientServicesDashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("user"));
            if (storedUser) {
                setUser(storedUser);
            }
        } catch (err) {
            console.error("Failed to parse user from session storage", err);
        }
    }, []);

    const satisfactionRates = {
        positive: 75,
        neutral: 15,
        negative: 10
    };

    return (
        <Layout role="assistantDirector" username={user?.full_name || "Lina"}>
            <div className="psd-container">
                <div className="psd-header">
                    <h1>Patient Services Dashboard</h1>
                    <p>Assistant Director of Nursing for Patient Services</p>
                </div>

                {/* 1. Summary Cards */}
                <div className="psd-summary-grid">
                    <div className="glass-card psd-summary-card">
                        <div className="psd-summary-card-title">Patient Satisfaction Score</div>
                        <div className="psd-summary-card-value">91%</div>
                        <div className="psd-summary-card-trend psd-trend-up">
                            <TrendingUp size={16} /> +2.5% from last month
                        </div>
                    </div>
                    <div className="glass-card psd-summary-card">
                        <div className="psd-summary-card-title">Monthly Complaints</div>
                        <div className="psd-summary-card-value">12</div>
                        <div className="psd-summary-card-trend psd-trend-down">
                            <TrendingDown size={16} /> -4 compared to last month
                        </div>
                    </div>
                    <div className="glass-card psd-summary-card">
                        <div className="psd-summary-card-title">Average Length of Stay</div>
                        <div className="psd-summary-card-value">4.2 Days</div>
                        <div className="psd-summary-card-trend psd-trend-down">
                            <TrendingDown size={16} /> -0.3 days from average
                        </div>
                    </div>
                    <div className="glass-card psd-summary-card">
                        <div className="psd-summary-card-title">Care Quality Score</div>
                        <div className="psd-summary-card-value">4.8/5</div>
                        <div className="psd-summary-card-trend psd-trend-up">
                            <TrendingUp size={16} /> Consistently high
                        </div>
                    </div>
                </div>

                {/* 2. Middle Charts */}
                <div className="psd-charts-grid">
                    {/* Satisfaction Rate Stacked Bar */}
                    <div className="content-box">
                        <h2 className="content-box-title">Overall Satisfaction Rate</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
                            Breakdown of patient feedback over the last 30 days.
                        </p>
                        
                        <div className="psd-stacked-bar-container">
                            <div className="psd-stacked-bar-wrapper">
                                <div className="psd-stacked-segment" style={{ width: `${satisfactionRates.positive}%`, backgroundColor: "var(--accent-green)" }}>
                                    {satisfactionRates.positive}%
                                </div>
                                <div className="psd-stacked-segment" style={{ width: `${satisfactionRates.neutral}%`, backgroundColor: "var(--accent-orange)" }}>
                                    {satisfactionRates.neutral}%
                                </div>
                                <div className="psd-stacked-segment" style={{ width: `${satisfactionRates.negative}%`, backgroundColor: "var(--accent-red)" }}>
                                    {satisfactionRates.negative}%
                                </div>
                            </div>
                            
                            <div className="psd-stacked-legend">
                                <div className="psd-legend-item">
                                    <div className="psd-legend-dot" style={{ backgroundColor: "var(--accent-green)" }}></div>
                                    Positive
                                </div>
                                <div className="psd-legend-item">
                                    <div className="psd-legend-dot" style={{ backgroundColor: "var(--accent-orange)" }}></div>
                                    Neutral
                                </div>
                                <div className="psd-legend-item">
                                    <div className="psd-legend-dot" style={{ backgroundColor: "var(--accent-red)" }}></div>
                                    Negative
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Outcomes Line Chart */}
                    <div className="content-box">
                        <h2 className="content-box-title">Patient Outcomes Track Record</h2>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <LineChart data={outcomeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#8ea2b5', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#8ea2b5', fontSize: 12}} />
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="fallRate" name="Fall Rate (%)" stroke="var(--accent-orange)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                    <Line type="monotone" dataKey="medErrors" name="Medication Errors (%)" stroke="var(--accent-red)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                    <Line type="monotone" dataKey="pressureInjuries" name="Pressure Injuries (%)" stroke="var(--accent-blue)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Section */}
                <div className="psd-bottom-grid">
                    {/* Staffing & Training */}
                    <div className="content-box psd-staffing-overview">
                        <h2 className="content-box-title">Staffing Overview</h2>
                        
                        <div className="psd-kpi-row">
                            <div className="psd-kpi-box">
                                <div className="psd-kpi-label">Understaffed Units</div>
                                <div className="psd-kpi-value" style={{ color: "var(--accent-red)" }}>2</div>
                            </div>
                            <div className="psd-kpi-box">
                                <div className="psd-kpi-label">Overstaffed Units</div>
                                <div className="psd-kpi-value" style={{ color: "var(--accent-orange)" }}>1</div>
                            </div>
                            <div className="psd-kpi-box">
                                <div className="psd-kpi-label">Total Overtime Hrs</div>
                                <div className="psd-kpi-value">340</div>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: 180, marginTop: '10px' }}>
                            <ResponsiveContainer>
                                <BarChart data={staffingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8ea2b5', fontSize: 11}} dy={5} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#8ea2b5', fontSize: 11}} />
                                    <RechartsTooltip cursor={{fill: '#f0f5fa'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="staff" name="Nurses Assigned" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Unit Satisfaction Table */}
                    <div className="content-box">
                        <h2 className="content-box-title">Unit Satisfaction Breakdown</h2>
                        <div className="psd-table-header">
                            <div>Unit Name</div>
                            <div>Satisfaction %</div>
                            <div>Trend</div>
                        </div>
                        <div className="psd-table-body">
                            {unitSatisfaction.map((item) => (
                                <div className="psd-table-row" key={item.id}>
                                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.unit}</div>
                                    <div style={{ fontWeight: 600 }}>{item.score}%</div>
                                    <div className={`psd-table-trend-icon ${item.trend === 'up' ? 'psd-trend-up' : 'psd-trend-down'}`}>
                                        {item.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {item.trend === 'up' ? 'Improving' : 'Declining'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
