import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";

export default function SupervisorDashboard() {
    const [search, setSearch] = useState("");
    const [nurses, setNurses] = useState([]);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [staffingFilter, setStaffingFilter] = useState("All Units");
    const [assignUnitFilters, setAssignUnitFilters] = useState([]);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);

    // Fetch data from backend
    useEffect(() => {
        fetch("http://localhost:4000/api/nurses")
            .then(res => res.json())
            .then(data => setNurses(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));

        fetch("http://localhost:4000/api/requests")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPendingRequests(data.filter(r => r.status && r.status.toLowerCase() === 'pending').length);
                }
            })
            .catch(err => console.error(err));
    }, []);

    // Calculate Top Stats
    const totalNurses = nurses.length;
    const units = [...new Set(nurses.map(n => n.unit).filter(Boolean))];
    const totalUnits = units.length;

    // Assigned Staff (Mapping real nurses)
    // Note: The database doesn't currently store 'shift' so we show 'TBD' or derive a mock shift
    const assignedStaff = nurses.map((nurse, index) => ({
        id: nurse.nurse_id || `0${index + 1}`,
        unit: nurse.unit || "Unassigned",
        name: nurse.full_name
    })).filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(search.toLowerCase());
        const matchesUnit = assignUnitFilters.length === 0 || assignUnitFilters.includes(staff.unit);
        return matchesSearch && matchesUnit;
    });

    const toggleUnitFilter = (u) => {
        setAssignUnitFilters(prev =>
            prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
        );
    };

    // Daily Staffing (Grouping by unit to calculate available staff)
    const dailyStaffing = units.map(unit => {
        const availableCount = nurses.filter(n => n.unit === unit).length;
        // Mock Required since it is not stored in DB
        const required = Math.max(availableCount + 3, 10);
        const coveragePercentage = Math.round((availableCount / required) * 100);

        let status = "safe";
        if (coveragePercentage < 65) status = "critical";
        else if (coveragePercentage < 75) status = "high-risk";
        else if (coveragePercentage < 85) status = "low-risk";

        return {
            unit,
            required,
            available: availableCount,
            coverage: `${coveragePercentage}%`,
            status
        };
    });

    const filteredDailyStaffing = staffingFilter === "All Units"
        ? dailyStaffing
        : dailyStaffing.filter(row => row.unit === staffingFilter);

    // Ratios (Mocked based on existing units, since patients data doesn't exist)
    const ratios = units.map((unit, index) => {
        const maxRatio = index % 2 === 0 ? "1:4" : "1:6";
        const exceeds = index % 3 === 0;
        return {
            unit,
            text: `1 nurses, ${exceeds ? 7 : 4} patients - Max: ${maxRatio}`,
            status: exceeds ? "exceeds" : "normal",
            value: exceeds ? 100 : 50
        };
    });

    // The top exceeding units to display in warning
    const exceedingUnitsStr = ratios.filter(r => r.status === 'exceeds').map(r => r.unit).join(', ') || 'None';

    return (
        <Layout role="supervisor" logoSrc="/logo.png" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Supervisor"}>

            <div className="main">
                <div className="supervisor-container">

                    {/* Top Stats Cards */}
                    <div className="cards-row">
                        <div className="wave-card glass-card">
                            <p><i><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></i> Number of Nurses</p>
                            <h1>{totalNurses}</h1>
                        </div>
                        <div className="wave-card glass-card">
                            <p><i><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></i> Units</p>
                            <h1>{totalUnits}</h1>
                        </div>
                        <div className="wave-card glass-card">
                            <p><i><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="13" r="3"></circle><path d="M12 11v2l1 1"></path></svg></i> Pending Requests</p>
                            <h1 style={{ color: "var(--accent-orange)" }}>{pendingRequests > 0 ? pendingRequests : 0}</h1>
                        </div>
                    </div>

                    {/* Middle Section */}
                    <div className="middle-section">
                        <div className="table-box content-box">
                            <div className="box-header" style={{ flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <h2 className="content-box-title">Assign staff</h2>
                                    <div className="actions">
                                        <button className="btn-pill" style={{ background: 'var(--accent-blue)', color: 'white' }} onClick={() => {
                                            setSearch("");
                                            setAssignUnitFilters([]);
                                        }}>Clear Filters</button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        placeholder="Search name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="input-pill"
                                        style={{ flex: 1, minWidth: "120px", padding: "6px 12px" }}
                                    />

                                    <div style={{ position: "relative" }}>
                                        <div
                                            className="filter-select"
                                            onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                                            style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: "110px", height: "100%", userSelect: "none" }}
                                        >
                                            <span>
                                                {assignUnitFilters.length === 0
                                                    ? "All Units"
                                                    : `${assignUnitFilters.length} Selected`}
                                            </span>
                                            <span style={{ fontSize: "10px", marginLeft: "8px" }}>▼</span>
                                        </div>
                                        {showUnitDropdown && (
                                            <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "5px", background: "#fff", border: "1px solid #c7d5e5", borderRadius: "10px", padding: "10px", zIndex: 10, display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: "150px" }}>
                                                {units.map(u => (
                                                    <label key={u} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#2f3e55", cursor: "pointer" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={assignUnitFilters.includes(u)}
                                                            onChange={() => toggleUnitFilter(u)}
                                                        />
                                                        {u}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>


                                </div>
                            </div>
                            <div className="custom-table" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                <div className="table-header" style={{ gridTemplateColumns: "0.5fr 1.5fr 2fr" }}>
                                    <span>#</span>
                                    <span>Unit</span>
                                    <span>Name</span>
                                </div>
                                {assignedStaff.length > 0 ? assignedStaff.map(staff => (
                                    <div key={staff.id} className="table-row premium-row" style={{ gridTemplateColumns: "0.5fr 1.5fr 2fr" }}>
                                        <span>{staff.id}</span>
                                        <span>{staff.unit}</span>
                                        <span>{staff.name}</span>
                                    </div>
                                )) : <div style={{ padding: "10px", color: "var(--text-secondary)" }}>No matching staff</div>}
                            </div>
                        </div>

                        <div className="table-box content-box">
                            <div className="box-header">
                                <h2 className="content-box-title">daily Staffing by Unit</h2>
                                <div className="actions">
                                    <select
                                        className="filter-select"
                                        value={staffingFilter}
                                        onChange={(e) => setStaffingFilter(e.target.value)}
                                    >
                                        <option value="All Units">All Units</option>
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="custom-table" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                <div className="table-header staffing-header">
                                    <span>Unit</span>
                                    <span>Required</span>
                                    <span>Available</span>
                                    <span>Coverage</span>
                                </div>
                                {filteredDailyStaffing.length > 0 ? filteredDailyStaffing.map((row, i) => (
                                    <div key={i} className="table-row staffing-row premium-row">
                                        <span>{row.unit}</span>
                                        <span>{row.required}</span>
                                        <span>{row.available}</span>
                                        <span className={`badge ${row.status}`}>{row.coverage}</span>
                                    </div>
                                )) : <div style={{ padding: "10px", color: "var(--text-secondary)" }}>No units data</div>}
                            </div>
                            <div className="legend">
                                <span className="legend-item critical">Critical shortage</span>
                                <span className="legend-item high-risk">High risk</span>
                                <span className="legend-item low-risk">Low Risk</span>
                                <span className="legend-item safe">Safe</span>
                                <span className="legend-item overstaffed">Overstaffed</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="warning-banner">
                        <i className="warning-icon">i</i> {ratios.filter(r => r.status === 'exceeds').length} Units are exceeding the allowed nurse-to-patient ratio: {exceedingUnitsStr}
                    </div>

                    <div className="table-box content-box">
                        <div className="box-header">
                            <h2 className="content-box-title">Nurse-to-patient Ratios by Unit</h2>
                            <div className="actions stack">
                                <button className="btn-pill" style={{ background: 'var(--accent-blue)', color: 'white' }}>Update Ratio</button>
                                <button className="btn-pill" style={{ background: 'var(--text-primary)', color: 'white' }}>View All</button>
                            </div>
                        </div>
                        <div className="ratios-list">
                            {ratios.map((ratio, i) => (
                                <div key={i} className="ratio-item">
                                    <div className="ratio-header">{ratio.unit}</div>
                                    <div className="ratio-pill-container">
                                        <div className="ratio-pill">
                                            <span className="ratio-details">{ratio.text}</span>
                                            <span className={`ratio-status-text ${ratio.status}`}>
                                                {ratio.status === 'exceeds' ? 'Exceeds' : 'Normal'}
                                            </span>
                                        </div>
                                        <div className="ratio-bar-bg">
                                            <div className={`ratio-bar-fill ${ratio.status}`} style={{ width: `${ratio.value}%` }}></div>
                                        </div>
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