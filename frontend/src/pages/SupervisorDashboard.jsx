import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";
import { io } from "socket.io-client";
import { Users, LayoutGrid, ClipboardCheck, ChevronRight } from "lucide-react";

export default function SupervisorDashboard() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [staffingSearch, setStaffingSearch] = useState("");
    const [nurses, setNurses] = useState([]);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [staffingFilter, setStaffingFilter] = useState("All Units");
    const [assignUnitFilters, setAssignUnitFilters] = useState([]);
    const [staffingUnitFilters, setStaffingUnitFilters] = useState([]);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    const [showStaffingDropdown, setShowStaffingDropdown] = useState(false);

    const fetchRequests = () => {
        fetch("http://localhost:4000/api/requests")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPendingRequests(data.filter(r => r.current_status && r.current_status === 'Pending').length);
                }
            })
            .catch(err => console.error(err));
    };

    // Fetch data from backend
    useEffect(() => {
        fetch("http://localhost:4000/api/nurses")
            .then(res => res.json())
            .then(data => setNurses(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));

        fetchRequests();
        const socket = io("http://localhost:4000");
        socket.on("request_updated", fetchRequests);
        return () => {
            socket.off("request_updated");
            socket.disconnect();
        };
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

    const toggleUnitFilter = (u, type = 'assign') => {
        if (type === 'assign') {
            setAssignUnitFilters(prev =>
                prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
            );
        } else {
            setStaffingUnitFilters(prev =>
                prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
            );
        }
    };

    // Daily Staffing (Grouping by unit to calculate available staff)
    const dailyStaffing = units.map(unit => {
        const availableCount = nurses.filter(n => n.unit === unit).length;
        // Mock Required since it is not stored in DB
        const required = Math.max(availableCount + 3, 10);
        const coveragePercentage = Math.round((availableCount / required) * 100);

        let status = "safe";
        if (coveragePercentage < 25) status = "critical";
        else if (coveragePercentage <= 50) status = "high-risk";
        else if (coveragePercentage <= 75) status = "low-risk";
        else if (coveragePercentage < 100) status = "safe";
        else status = "overstaffed";

        return {
            unit,
            required,
            available: availableCount,
            coverage: `${coveragePercentage}%`,
            status
        };
    });

    const filteredDailyStaffing = dailyStaffing.filter(row => {
        const matchesUnit = staffingUnitFilters.length === 0 || staffingUnitFilters.includes(row.unit);
        const matchesSearch = row.unit.toLowerCase().includes(staffingSearch.toLowerCase());
        return matchesUnit && matchesSearch;
    });

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
                        <div className="glass-card blue">
                            <p><Users size={20} /> Number of Nurses</p>
                            <h1>{totalNurses}</h1>
                        </div>
                        <div className="glass-card blue">
                            <p><LayoutGrid size={20} /> Units</p>
                            <h1>{totalUnits}</h1>
                        </div>
                        <div className="glass-card yellow">
                            <p><ClipboardCheck size={20} /> Pending Requests</p>
                            <h1>{pendingRequests > 0 ? pendingRequests : 0}</h1>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '700', marginTop: '30px' }}>Quick Actions</h3>
                    <div className="cards-row" style={{ marginBottom: '40px' }}>
                        <div className="glass-card blue clickable-card" 
                             style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', height: '180px', position: 'relative' }}
                             onClick={() => navigate('/assign-staff')}>
                            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '22px', position: 'relative', zIndex: 2 }}>Assign Staff</h2>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '280px', position: 'relative', zIndex: 2 }}>Manage daily staff deployments across all units.</p>
                            <ChevronRight style={{ position: 'absolute', right: '20px', color: 'var(--text-muted)', zIndex: 2 }} size={24} />
                        </div>

                        <div className="glass-card blue clickable-card" 
                             style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', height: '180px', position: 'relative' }}
                             onClick={() => navigate('/supervisor/manage-requests')}>
                            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '22px', position: 'relative', zIndex: 2 }}>Manage Requests</h2>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '280px', position: 'relative', zIndex: 2 }}>Review and process staff leave and scheduling requests.</p>
                            <ChevronRight style={{ position: 'absolute', right: '20px', color: 'var(--text-muted)', zIndex: 2 }} size={24} />
                        </div>
                    </div>

                    {/* Middle Section */}
                    <div className="middle-section">
                        <div className="table-box content-box">
                            <div className="box-header" style={{ marginBottom: '20px' }}>
                                <h2 className="content-box-title">Assigned Staff</h2>
                                <div className="actions">
                                    <button className="add-nurse-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => {
                                        setSearch("");
                                        setStaffingSearch("");
                                        setAssignUnitFilters([]);
                                        setStaffingUnitFilters([]);
                                    }}>Clear Filters</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="Search name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input-pill"
                                    style={{ flex: 1, height: '42px' }}
                                />

                                <div style={{ position: "relative" }}>
                                    <button
                                        className="filter-select"
                                        onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                                        style={{ 
                                            background: 'var(--accent-blue)', 
                                            color: 'white', 
                                            height: '42px', 
                                            padding: '0 20px', 
                                            borderRadius: 'var(--radius-lg)',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {assignUnitFilters.length === 0
                                            ? "All Units"
                                            : `${assignUnitFilters.length} Selected`}
                                        <span style={{ fontSize: "10px" }}>▼</span>
                                    </button>
                                    {showUnitDropdown && (
                                        <div className="glass-card" style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "#fff", padding: "15px", zIndex: 100, display: "flex", flexDirection: "column", gap: "10px", minWidth: "180px", boxShadow: 'var(--shadow-premium)' }}>
                                            {units.map(u => (
                                                <label key={u} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--text-primary)", cursor: "pointer" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={assignUnitFilters.includes(u)}
                                                        onChange={() => toggleUnitFilter(u)}
                                                        style={{ width: '16px', height: '16px' }}
                                                    />
                                                    {u}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="nurse-table-header" style={{ gridTemplateColumns: "0.5fr 1.5fr 2fr" }}>
                                <span>#</span>
                                <span>Unit</span>
                                <span>Name</span>
                            </div>
                            <div style={{ maxHeight: "400px", overflowY: "auto", pr: '5px' }}>
                                {assignedStaff.length > 0 ? assignedStaff.map((staff, idx) => (
                                    <div key={staff.id} className="nurse-table-row premium-row" style={{ gridTemplateColumns: "0.5fr 1.5fr 2fr" }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>{idx + 1}</span>
                                        <span style={{ fontWeight: '500' }}>{staff.unit}</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{staff.name}</span>
                                    </div>
                                )) : <div style={{ padding: "30px", textAlign: 'center', color: "var(--text-muted)" }}>No matching staff</div>}
                            </div>
                        </div>

                        <div className="table-box content-box">
                            <div className="box-header" style={{ marginBottom: '20px' }}>
                                <h2 className="content-box-title">Daily Staffing by Unit</h2>
                                <div className="actions">
                                    <button className="add-nurse-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => {
                                        setSearch("");
                                        setStaffingSearch("");
                                        setAssignUnitFilters([]);
                                        setStaffingUnitFilters([]);
                                    }}>Clear Filters</button>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="Search unit..."
                                    value={staffingSearch}
                                    onChange={(e) => setStaffingSearch(e.target.value)}
                                    className="input-pill"
                                    style={{ flex: 1, height: '42px' }}
                                />

                                <div style={{ position: "relative" }}>
                                    <button
                                        className="filter-select"
                                        onClick={() => setShowStaffingDropdown(!showStaffingDropdown)}
                                        style={{ 
                                            background: 'var(--accent-blue)', 
                                            color: 'white', 
                                            height: '42px', 
                                            padding: '0 20px', 
                                            borderRadius: 'var(--radius-lg)',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {staffingUnitFilters.length === 0
                                            ? "All Units"
                                            : `${staffingUnitFilters.length} Selected`}
                                        <span style={{ fontSize: "10px" }}>▼</span>
                                    </button>
                                    {showStaffingDropdown && (
                                        <div className="glass-card" style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "#fff", padding: "15px", zIndex: 100, display: "flex", flexDirection: "column", gap: "10px", minWidth: "180px", boxShadow: 'var(--shadow-premium)' }}>
                                            {units.map(u => (
                                                <label key={u} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--text-primary)", cursor: "pointer" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={staffingUnitFilters.includes(u)}
                                                        onChange={() => toggleUnitFilter(u, 'staffing')}
                                                        style={{ width: '16px', height: '16px' }}
                                                    />
                                                    {u}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="nurse-table-header" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr" }}>
                                <span>Unit</span>
                                <span>Required</span>
                                <span>Available</span>
                                <span>Coverage</span>
                            </div>
                            <div style={{ maxHeight: "400px", overflowY: "auto", pr: '5px' }}>
                                {filteredDailyStaffing.length > 0 ? filteredDailyStaffing.map((row, i) => (
                                    <div key={i} className="nurse-table-row premium-row" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr" }}>
                                        <span style={{ fontWeight: '600' }}>{row.unit}</span>
                                        <span style={{ textAlign: 'center' }}>{row.required}</span>
                                        <span style={{ textAlign: 'center' }}>{row.available}</span>
                                        <span style={{ display: 'flex', justifyContent: 'center' }}>
                                            <span className={`status ${row.status}`}>{row.coverage}</span>
                                        </span>
                                    </div>
                                )) : <div style={{ padding: "30px", textAlign: 'center', color: "var(--text-muted)" }}>No units data</div>}
                            </div>
                            
                            <div className="legend" style={{ marginTop: '20px', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                <span className="status critical" style={{ fontSize: '11px' }}>Critical shortage</span>
                                <span className="status high-risk" style={{ fontSize: '11px' }}>High risk</span>
                                <span className="status low-risk" style={{ fontSize: '11px' }}>Low Risk</span>
                                <span className="status safe" style={{ fontSize: '11px' }}>Safe</span>
                                <span className="status overstaffed" style={{ fontSize: '11px' }}>Overstaffed</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="warning-banner">
                        <i className="warning-icon">i</i> {ratios.filter(r => r.status === 'exceeds').length} Units are exceeding the allowed nurse-to-patient ratio: {exceedingUnitsStr}
                    </div>

                    <div className="table-box content-box" style={{ marginTop: '24px' }}>
                        <div className="box-header" style={{ marginBottom: '24px' }}>
                            <h2 className="content-box-title">Nurse-to-patient Ratios by Unit</h2>
                            <div className="actions" style={{ display: 'flex', gap: '12px' }}>
                                <button className="add-nurse-btn" style={{ padding: '10px 20px' }}>Update Ratio</button>
                                <button className="add-nurse-btn" style={{ padding: '10px 20px', background: 'var(--text-primary)' }}>View All</button>
                            </div>
                        </div>
                        <div className="ratios-list">
                            {ratios.map((ratio, i) => (
                                <div key={i} className="ratio-row">
                                    <div className="ratio-top-line">
                                        <div className="ratio-unit-name">{ratio.unit}</div>
                                        <div className="ratio-badge">{ratio.text}</div>
                                        <div className={`ratio-status-label ${ratio.status}`}>
                                            {ratio.status === 'exceeds' ? 'Exceeds' : 'Normal'}
                                        </div>
                                    </div>
                                    <div className="ratio-bar-container">
                                        <div className="ratio-bar-track">
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