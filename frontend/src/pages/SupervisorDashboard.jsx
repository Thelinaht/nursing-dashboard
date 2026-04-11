import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";

export default function SupervisorDashboard() {
    const [search, setSearch] = useState("");
    const [nurses, setNurses] = useState([]);
    const [staffingFilter, setStaffingFilter] = useState("All Units");
    const [assignUnitFilters, setAssignUnitFilters] = useState([]);
    const [assignShiftFilter, setAssignShiftFilter] = useState("All Shifts");
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    
    // Fetch data from backend
    useEffect(() => {
        fetch("http://localhost:4000/api/nurses")
            .then(res => res.json())
            .then(data => setNurses(Array.isArray(data) ? data : []))
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
        name: nurse.full_name,
        shift: ["Day", "Evening", "Night"][index % 3] // Mock shift since not in DB
    })).filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(search.toLowerCase());
        const matchesUnit = assignUnitFilters.length === 0 || assignUnitFilters.includes(staff.unit);
        const matchesShift = assignShiftFilter === "All Shifts" || staff.shift === assignShiftFilter;
        return matchesSearch && matchesUnit && matchesShift;
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
        <Layout role="supervisor" logoSrc="/logo.png" username="Supervisor">
            <div className="main">
                <div className="supervisor-container">
                    
                    {/* Top Stats Cards */}
                    <div className="cards-row">
                        <div className="wave-card">
                            <p><i>👥</i> Number of Nurses</p>
                            <h1>{totalNurses}</h1>
                        </div>
                        <div className="wave-card">
                            <p><i>🏥</i> Units</p>
                            <h1>{totalUnits}</h1>
                        </div>
                        <div className="wave-card danger-text">
                            <p><i>⚕️</i> Patient-to-staff Ratio</p>
                            <h1>3</h1> {/* Mocked since total patients isn't in DB */}
                        </div>
                    </div>

                    {/* Middle Section */}
                    <div className="middle-section">
                        <div className="table-box">
                            <div className="box-header" style={{ flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <h2 className="table-title">Assign staff</h2>
                                    <div className="actions">
                                        <button className="btn-small dark" onClick={() => {
                                            setSearch("");
                                            setAssignUnitFilters([]);
                                            setAssignShiftFilter("All Shifts");
                                        }}>Clear Filters</button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        placeholder="🔍 Search name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="search-input"
                                        style={{ flex: 1, minWidth: "120px", padding: "6px 12px", borderRadius: "10px", border: "none", outline: "none", background: "#dce4ed", color: "#2f3e55", fontSize: "12px" }}
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

                                    <select 
                                        className="filter-select"
                                        value={assignShiftFilter}
                                        onChange={e => setAssignShiftFilter(e.target.value)}
                                    >
                                        <option value="All Shifts">All Shifts</option>
                                        <option value="Day">Day</option>
                                        <option value="Evening">Evening</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </div>
                            </div>
                            <div className="custom-table" style={{maxHeight: "300px", overflowY: "auto"}}>
                                <div className="table-header">
                                    <span>#</span>
                                    <span>Unit</span>
                                    <span>Name</span>
                                    <span>Shift</span>
                                </div>
                                {assignedStaff.length > 0 ? assignedStaff.map(staff => (
                                    <div key={staff.id} className="table-row">
                                        <span>{staff.id}</span>
                                        <span>{staff.unit}</span>
                                        <span>{staff.name}</span>
                                        <span>{staff.shift}</span>
                                    </div>
                                )) : <div style={{padding: "10px", color: "#44596f"}}>No matching staff</div>}
                            </div>
                        </div>

                        <div className="table-box">
                            <div className="box-header">
                                <h2 className="table-title">daily Staffing by Unit</h2>
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
                            <div className="custom-table" style={{maxHeight: "300px", overflowY: "auto"}}>
                                <div className="table-header staffing-header">
                                    <span>Unit</span>
                                    <span>Required</span>
                                    <span>Available</span>
                                    <span>Coverage</span>
                                </div>
                                {filteredDailyStaffing.length > 0 ? filteredDailyStaffing.map((row, i) => (
                                    <div key={i} className="table-row staffing-row">
                                        <span>{row.unit}</span>
                                        <span>{row.required}</span>
                                        <span>{row.available}</span>
                                        <span className={`badge ${row.status}`}>{row.coverage}</span>
                                    </div>
                                )) : <div style={{padding: "10px", color: "#44596f"}}>No units data</div>}
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

                    <div className="table-box">
                        <div className="box-header">
                            <h2 className="table-title">Nurse-to-patient Ratios by Unit</h2>
                            <div className="actions stack">
                                <button className="btn-small">Update Ratio</button>
                                <button className="btn-small dark">View All</button>
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