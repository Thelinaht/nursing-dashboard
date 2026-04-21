import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";

export default function AssignStaff() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [search, setSearch] = useState("");
    
    const [availableNurses, setAvailableNurses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [selectedNurse, setSelectedNurse] = useState(null);
    const [targetUnit, setTargetUnit] = useState("");
    const [targetShift, setTargetShift] = useState("Day");
    const [conflictWarning, setConflictWarning] = useState("");


    const fetchAssignments = async (date) => {
        try {
            const [nursesRes, assignRes] = await Promise.all([
                fetch(`http://localhost:4000/api/nurses/available?date=${date}`),
                fetch(`http://localhost:4000/api/assignments?date=${date}`)
            ]);
            
            if (!nursesRes.ok || !assignRes.ok) throw new Error("API failed");
            
            const nurses = await nursesRes.json();
            const assigns = await assignRes.json();
            
            setAvailableNurses(nurses);
            setAssignments(assigns);
        } catch (error) {
            console.error("API error", error);
            // On error, clear state so mock data doesn't appear
            setAvailableNurses([]);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAssignments(selectedDate);
        setSelectedNurse(null);
        setConflictWarning("");
    }, [selectedDate]);

    const handleAssign = async () => {
        if (!selectedNurse || !targetUnit) return;

        // Check for double assignment
        const existing = assignments.find(a => a.nurse_id === selectedNurse.nurse_id);
        if (existing && !conflictWarning) {
            setConflictWarning(`Warning: ${selectedNurse.full_name} is already assigned to ${existing.unit} (${existing.shift}). Confirm to reassign.`);
            return;
        }

        try {
            const res = await fetch("http://localhost:4000/api/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nurse_id: selectedNurse.nurse_id,
                    unit: targetUnit,
                    shift: targetShift,
                    assignment_date: selectedDate
                })
            });

            if (!res.ok) throw new Error("API failed");
            
            // Refresh tables
            fetchAssignments(selectedDate);
            setSelectedNurse(null);
            setTargetUnit("");
            setConflictWarning("");
            
        } catch (error) {
            console.error("Error updating assignment", error);
        }
    };

    const handleRemove = async (assignment_id, nurse_id) => {
        try {
            const res = await fetch(`http://localhost:4000/api/assignments/${assignment_id}`, {
                 method: "DELETE" 
            });
            if (!res.ok) throw new Error("API failed");
            
            fetchAssignments(selectedDate);
        } catch (error) {
            console.error("Error removing assignment", error);
        }
    };

    // Calculate Stats
    const totalAssigned = assignments.length;
    const totalUnassigned = availableNurses.filter(n => !n.assigned_unit).length;
    const unitsCovered = [...new Set(assignments.map(a => a.unit))].length;

    // Filter available nurses list
    const filteredNurses = availableNurses.filter(nurse => 
        nurse.full_name.toLowerCase().includes(search.toLowerCase())
    );

    // Compute dynamic units from the real list of nurses
    const availableUnits = [...new Set(availableNurses.map(n => n.home_unit).filter(Boolean))].sort();

    // Group assignments by unit
    const groupedAssignments = assignments.reduce((acc, curr) => {
        acc[curr.unit] = acc[curr.unit] || [];
        acc[curr.unit].push(curr);
        return acc;
    }, {});
    
    const userDisplay = JSON.parse(sessionStorage.getItem("user"))?.full_name || "Supervisor";

    return (
        <Layout role="supervisor" logoSrc="/logo.png" username={userDisplay}>
            <div className="main">
                <div className="supervisor-container">
                    
                    {/* Header and Top Stats */}
                    <div className="box-header" style={{ marginBottom: "20px" }}>
                        <div>
                            <h2 className="table-title">Daily Staff Assignment</h2>
                            <p style={{ fontSize: "14px", color: "#44596f", marginTop: "5px" }}>
                                Manage nursing deployments across all units.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#2f3e55" }}>📅 Select Date:</span>
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={e => setSelectedDate(e.target.value)}
                                className="search-input filter-select"
                                style={{ padding: "8px 12px", background: "#fff" }}
                            />
                        </div>
                    </div>

                    <div className="cards-row">
                        <div className="wave-card">
                            <p><i>✅</i> Total Assigned Today</p>
                            <h1>{loading ? "-" : totalAssigned}</h1>
                        </div>
                        <div className="wave-card danger-text">
                            <p><i>⚠️</i> Unassigned Nurses</p>
                            <h1>{loading ? "-" : totalUnassigned}</h1>
                        </div>
                        <div className="wave-card">
                            <p><i>🏥</i> Units Covered</p>
                            <h1>{loading ? "-" : unitsCovered}</h1>
                        </div>
                    </div>

                    <div className="middle-section" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        
                        {/* Left Panel: Available Nurses */}
                        <div className="table-box" style={{ display: "flex", flexDirection: "column" }}>
                            <div className="box-header">
                                <h2 className="table-title">Available Nurses</h2>
                                <input
                                    type="text"
                                    placeholder="🔍 Search name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="search-input"
                                    style={{ width: "150px", padding: "6px 12px", borderRadius: "10px", border: "none", outline: "none", background: "#dce4ed", color: "#2f3e55", fontSize: "12px" }}
                                />
                            </div>
                            
                            <div className="custom-table" style={{ flex: 1, maxHeight: "350px", overflowY: "auto", borderBottom: "1px solid #c7d5e5" }}>
                                <div className="table-header">
                                    <span>#</span>
                                    <span>Unit</span>
                                    <span>Name</span>
                                    <span>Status</span>
                                </div>
                                {loading ? <div style={{padding: "10px", color: "#44596f"}}>Loading...</div> : 
                                 filteredNurses.length > 0 ? filteredNurses.map(nurse => (
                                    <div 
                                        key={nurse.nurse_id} 
                                        className="table-row" 
                                        style={{ 
                                            cursor: "pointer", 
                                            background: selectedNurse?.nurse_id === nurse.nurse_id ? "#b7c9dc" : undefined
                                        }}
                                        onClick={() => {
                                            setSelectedNurse(nurse);
                                            setTargetUnit(nurse.home_unit || (availableUnits.length > 0 ? availableUnits[0] : ""));
                                            setConflictWarning("");
                                        }}
                                    >
                                        <span>{nurse.nurse_id}</span>
                                        <span>{nurse.home_unit || "Unassigned"}</span>
                                        <span>{nurse.full_name}</span>
                                        <span>
                                            {nurse.assigned_unit 
                                                ? <span style={{ color: "#bd8300", fontWeight: "bold" }}>Assigned ({nurse.assigned_unit})</span>
                                                : <span style={{ color: "#2a733e", fontWeight: "bold" }}>Available</span>
                                            }
                                        </span>
                                    </div>
                                )) : <div style={{padding: "10px", color: "#44596f"}}>No matching nurses found.</div>}
                            </div>
                            
                            {/* Assigment Form */}
                            <div style={{ padding: "15px", background: "#f2f6fa", borderRadius: "0 0 15px 15px" }}>
                                {selectedNurse ? (
                                    <div>
                                        <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "#2f3e55" }}>
                                            Assigning: <span style={{ fontWeight: "bold" }}>{selectedNurse.full_name}</span>
                                        </h3>
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <select 
                                                className="filter-select"
                                                value={targetUnit}
                                                onChange={e => {
                                                    setTargetUnit(e.target.value);
                                                    setConflictWarning("");
                                                }}
                                                style={{ flex: 1 }}
                                            >
                                                <option value="" disabled>Select Unit</option>
                                                {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            
                                            <select 
                                                className="filter-select"
                                                value={targetShift}
                                                onChange={e => {
                                                    setTargetShift(e.target.value);
                                                    setConflictWarning("");
                                                }}
                                                style={{ width: "100px" }}
                                            >
                                                <option value="Day">Day</option>
                                                <option value="Evening">Evening</option>
                                                <option value="Night">Night</option>
                                            </select>
                                            
                                            <button className="btn-small dark" onClick={handleAssign}>
                                                {conflictWarning ? "Confirm Reassign" : "Assign"}
                                            </button>
                                        </div>
                                        {conflictWarning && (
                                            <div style={{ marginTop: "10px", fontSize: "12px", color: "#d9534f", fontWeight: "bold" }}>
                                                {conflictWarning}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: "13px", color: "#44596f", textAlign: "center", fontStyle: "italic" }}>
                                        Select a nurse from the list above to assign them.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Today's Assignments */}
                        <div className="table-box">
                            <div className="box-header">
                                <h2 className="table-title">Assignments for {selectedDate}</h2>
                            </div>
                            
                            <div style={{ maxHeight: "450px", overflowY: "auto", padding: "0 10px 10px 10px" }}>
                                {loading ? <div style={{padding: "10px", color: "#44596f"}}>Loading...</div> :
                                 Object.keys(groupedAssignments).length > 0 ? (
                                    Object.keys(groupedAssignments).map(unit => (
                                        <div key={unit} style={{ marginBottom: "20px" }}>
                                            <h3 style={{ fontSize: "13px", background: "#dce4ed", padding: "8px 12px", borderRadius: "8px", color: "#2f3e55", marginBottom: "8px", textTransform: "uppercase" }}>
                                                🏥 {unit} ({groupedAssignments[unit].length})
                                            </h3>
                                            <div className="custom-table" style={{ background: "transparent" }}>
                                                <div className="table-header" style={{ padding: "5px 12px", gridTemplateColumns: "1.5fr 1fr 1fr" }}>
                                                    <span>Name</span>
                                                    <span>Shift</span>
                                                    <span style={{ textAlign: "right" }}>Actions</span>
                                                </div>
                                                {groupedAssignments[unit].map(assign => (
                                                    <div key={assign.assignment_id} className="table-row" style={{ padding: "8px 12px", fontSize: "12px", gridTemplateColumns: "1.5fr 1fr 1fr" }}>
                                                        <span style={{ fontWeight: "bold" }}>{assign.full_name}</span>
                                                        <span>{assign.shift}</span>
                                                        <span style={{ textAlign: "right" }}>
                                                            <button 
                                                                style={{ border: "none", background: "none", color: "#d9534f", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}
                                                                onClick={() => handleRemove(assign.assignment_id, assign.nurse_id)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : <div style={{padding: "10px", color: "#44596f"}}>No assignments made for this date yet.</div>}
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </Layout>
    );
}
