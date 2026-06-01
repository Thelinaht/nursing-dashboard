import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";

export default function AssignStaff() {
    const supervisorUnit = JSON.parse(sessionStorage.getItem("user"))?.unit || null;
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [search, setSearch] = useState("");

    const [availableNurses, setAvailableNurses] = useState([]);
    const [hospitalUnits, setHospitalUnits] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [selectedNurse, setSelectedNurse] = useState(null);
    const [formMode, setFormMode] = useState("assign"); // "assign" | "reassign"
    const [reassignNurse, setReassignNurse] = useState(null);
    const [reassignUnit, setReassignUnit] = useState("");
    const [reassignShift, setReassignShift] = useState("Day");
    const [showReassignModal, setShowReassignModal] = useState(false);
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
        fetch("http://localhost:4000/api/training/units")
            .then(r => r.json())
            .then(data => setHospitalUnits(Array.isArray(data) ? data.map(u => u.unit_name) : []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchAssignments(selectedDate);
        setSelectedNurse(null);
        setConflictWarning("");
    }, [selectedDate]);

    const handleAssign = async () => {
        if (!selectedNurse) return;

        // Check for double assignment
        const existing = assignments.find(a => a.nurse_id === selectedNurse.nurse_id);
        if (existing && !conflictWarning) {
            setConflictWarning(`Warning: ${selectedNurse.full_name} is already assigned to ${existing.unit} (${existing.shift}). Confirm to reassign.`);
            return;
        }

        try {
            const assignUnit = supervisorUnit || selectedNurse.home_unit || "";
            const res = await fetch("http://localhost:4000/api/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nurse_id: selectedNurse.nurse_id,
                    unit: assignUnit,
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

    // Calculate Stats — scoped to supervisor's unit
    const myAssignments = supervisorUnit ? assignments.filter(a => a.unit === supervisorUnit) : assignments;
    const myNurses = supervisorUnit ? availableNurses.filter(n => n.home_unit === supervisorUnit || n.unit === supervisorUnit) : availableNurses;
    const totalAssigned = myAssignments.length;
    const totalUnassigned = myNurses.filter(n => !n.assigned_unit).length;
    const unitsCovered = [...new Set(myAssignments.map(a => a.unit))].length;

    // Filter available nurses list — scoped to supervisor's unit
    const filteredNurses = availableNurses.filter(nurse => {
        const matchSearch = nurse.full_name.toLowerCase().includes(search.toLowerCase());
        const matchUnit = supervisorUnit ? (nurse.home_unit === supervisorUnit || nurse.unit === supervisorUnit) : true;
        return matchSearch && matchUnit;
    });

    // Units dropdown — only supervisor's unit for assign
    const availableUnits = supervisorUnit
        ? [supervisorUnit]
        : [...new Set(availableNurses.map(n => n.home_unit).filter(Boolean))].sort();

    // All units for reassign — from Hospital_unit table
    const allUnits = hospitalUnits.length > 0 ? hospitalUnits : [...new Set(availableNurses.map(n => n.home_unit).filter(Boolean))].sort();

    // Group assignments by unit — scoped to supervisor's unit
    const groupedAssignments = assignments
        .filter(a => supervisorUnit ? a.unit === supervisorUnit : true)
        .reduce((acc, curr) => {
            acc[curr.unit] = acc[curr.unit] || [];
            acc[curr.unit].push(curr);
            return acc;
        }, {});

    const handleReassignDirect = async () => {
        if (!selectedNurse || !targetUnit) return;
        try {
            // Only update the nurse's unit in Nursing_staff — no DailyAssignment entry
            const res = await fetch(`http://localhost:4000/api/nurses/${selectedNurse.nurse_id}/unit`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ unit: targetUnit })
            });
            if (!res.ok) throw new Error("Failed");
            setSelectedNurse(null);
            setTargetUnit("");
            setFormMode("assign");
            fetchAssignments(selectedDate);
            alert(`✅ ${selectedNurse.full_name} moved to ${targetUnit}`);
        } catch (err) {
            alert("❌ Reassign failed");
        }
    };

    const handleReassign = async () => {
        if (!reassignNurse || !reassignUnit) return;
        try {
            const res = await fetch("http://localhost:4000/api/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nurse_id: reassignNurse.nurse_id,
                    unit: reassignUnit,
                    shift: reassignShift,
                    assignment_date: selectedDate
                })
            });
            if (!res.ok) throw new Error("Failed");
            setShowReassignModal(false);
            setReassignNurse(null);
            setReassignUnit("");
            fetchAssignments(selectedDate);
            alert(`✅ ${reassignNurse.full_name} reassigned to ${reassignUnit}`);
        } catch (err) {
            alert("❌ Reassign failed");
        }
    };

    const userDisplay = JSON.parse(sessionStorage.getItem("user"))?.full_name || "Supervisor";

    return (
        <Layout role="supervisor" logoSrc="/logo.png" username={userDisplay}>
            <div className="main">
                <div className="supervisor-container">

                    {/* Header and Top Stats */}
                    <div className="box-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 className="table-title" style={{ margin: 0 }}>Daily Staff Assignment</h2>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#2f3e55" }}>📅 Select Date:</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="search-input filter-select"
                                style={{ padding: "8px 12px", background: "#fff", color: "#2f3e55", borderRadius: "8px", border: "1px solid #c7d5e5", outline: "none" }}
                            />
                        </div>
                    </div>

                    <div className="cards-row">
                        <div className="glass-card blue">
                            <p><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg> Total Assigned Today</p>
                            <h1>{loading ? "-" : totalAssigned}</h1>
                        </div>
                        <div className="glass-card red">
                            <p><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" y1="11" x2="23" y2="11"></line></svg> Unassigned Nurses</p>
                            <h1>{loading ? "-" : totalUnassigned}</h1>
                        </div>

                    </div>

                    <div className="middle-section" style={{ gridTemplateColumns: "1.3fr 1fr", gap: "20px" }}>

                        {/* Left Panel: Available Nurses */}
                        <div className="table-box content-box" style={{ display: "flex", flexDirection: "column" }}>
                            <div className="box-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                                <h2 className="table-title">Available Nurses</h2>
                                <input
                                    type="text"
                                    placeholder="Search name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="search-input"
                                    style={{ width: "100%", padding: "6px 12px", borderRadius: "10px", border: "none", outline: "none", background: "#dce4ed", color: "#2f3e55", fontSize: "12px" }}
                                />
                            </div>

                            <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", maxHeight: "350px", border: "1px solid rgba(74,106,133,0.12)", borderRadius: "12px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: "12px", fontWeight: 600, color: "#2f3e55", textAlign: "left", position: "sticky", top: 0, background: "white", boxShadow: "inset 0 -1px 0 rgba(74,106,133,0.15)", borderTopLeftRadius: "12px" }}>#</th>
                                            <th style={{ padding: "12px", fontWeight: 600, color: "#2f3e55", textAlign: "left", position: "sticky", top: 0, background: "white", boxShadow: "inset 0 -1px 0 rgba(74,106,133,0.15)" }}>Unit</th>
                                            <th style={{ padding: "12px", fontWeight: 600, color: "#2f3e55", textAlign: "left", position: "sticky", top: 0, background: "white", boxShadow: "inset 0 -1px 0 rgba(74,106,133,0.15)" }}>Name</th>
                                            <th style={{ padding: "12px", fontWeight: 600, color: "#2f3e55", textAlign: "left", position: "sticky", top: 0, background: "white", boxShadow: "inset 0 -1px 0 rgba(74,106,133,0.15)", borderTopRightRadius: "12px" }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading
                                            ? <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                                            : filteredNurses.length > 0 ? filteredNurses.map((nurse, idx) => (
                                                <tr key={nurse.nurse_id}
                                                    onClick={() => { setSelectedNurse(nurse); setTargetUnit(""); setFormMode("assign"); setConflictWarning(""); }}
                                                    style={{ cursor: "pointer", background: selectedNurse?.nurse_id === nurse.nurse_id ? "#dce6f2" : "white", borderBottom: "1px solid rgba(74,106,133,0.08)", transition: "background 0.15s" }}
                                                    onMouseEnter={e => { if (selectedNurse?.nurse_id !== nurse.nurse_id) e.currentTarget.style.background = "#f1f5f9"; }}
                                                    onMouseLeave={e => { if (selectedNurse?.nurse_id !== nurse.nurse_id) e.currentTarget.style.background = "white"; }}
                                                >
                                                    <td style={{ padding: "13px 12px", color: "#94a3b8" }}>{idx + 1}</td>
                                                    <td style={{ padding: "13px 12px", color: "#475569" }}>{nurse.home_unit || "Unassigned"}</td>
                                                    <td style={{ padding: "13px 12px", color: "#1e293b", fontWeight: 600 }}>{nurse.full_name}</td>
                                                    <td style={{ padding: "13px 12px" }}>
                                                        {nurse.assigned_unit
                                                            ? <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: "20px", fontWeight: 600, fontSize: "11px" }}>Assigned</span>
                                                            : <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "20px", fontWeight: 600, fontSize: "11px" }}>Available</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                                : <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>No matching nurses found.</td></tr>
                                        }
                                    </tbody>
                                </table>
                            </div>

                            {/* Assignment Form */}
                            <div style={{ padding: "15px", background: "#f2f6fa", borderRadius: "0 0 15px 15px" }}>
                                {selectedNurse ? (
                                    <div>
                                        <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "#2f3e55" }}>
                                            Selected: <span style={{ fontWeight: "bold" }}>{selectedNurse.full_name}</span>
                                        </h3>

                                        {/* Action toggle */}
                                        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                            <button
                                                onClick={() => setFormMode("assign")}
                                                style={{
                                                    flex: 1, padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px",
                                                    background: formMode === "assign" ? "#3b4c6e" : "#dce6f2",
                                                    color: formMode === "assign" ? "white" : "#3b4c6e",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                Assign
                                            </button>
                                            <button
                                                onClick={() => setFormMode("reassign")}
                                                style={{
                                                    flex: 1, padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px",
                                                    background: formMode === "reassign" ? "#3b4c6e" : "#dce6f2",
                                                    color: formMode === "reassign" ? "white" : "#3b4c6e",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                Reassign
                                            </button>
                                        </div>

                                        {/* Assign mode — shift only */}
                                        {formMode === "assign" && (
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <select value={targetShift}
                                                    onChange={e => { setTargetShift(e.target.value); setConflictWarning(""); }}
                                                    style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "none", background: "#dce6f2", color: "#2f3e55", outline: "none", fontWeight: "500", cursor: "pointer" }}>
                                                    <option value="Day">Day</option>
                                                    <option value="Night">Night</option>
                                                </select>
                                                <button style={{ background: "#3b4c6e", color: "white", padding: "8px 24px", fontWeight: 600, fontSize: "13px", borderRadius: "10px", border: "none", cursor: "pointer", transition: "all 0.2s" }} onClick={handleAssign}>
                                                    Assign
                                                </button>
                                            </div>
                                        )}

                                        {/* Reassign mode — unit dropdown */}
                                        {formMode === "reassign" && (
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <select value={targetUnit}
                                                    onChange={e => { setTargetUnit(e.target.value); setConflictWarning(""); }}
                                                    style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "none", background: "#dce6f2", color: "#2f3e55", outline: "none", fontWeight: "500", cursor: "pointer" }}>
                                                    <option value="" disabled>Select new unit...</option>
                                                    {allUnits.map(u => <option key={u} value={u} style={{ color: "#2f3e55", background: "white" }}>{u}</option>)}
                                                </select>
                                                <button
                                                    style={{ background: "#3b4c6e", color: "white", padding: "8px 24px", fontWeight: 600, fontSize: "13px", borderRadius: "10px", border: "none", cursor: targetUnit ? "pointer" : "not-allowed", opacity: targetUnit ? 1 : 0.5, transition: "all 0.2s" }}
                                                    onClick={handleReassignDirect} disabled={!targetUnit}>
                                                    Reassign
                                                </button>
                                            </div>
                                        )}

                                        {conflictWarning && (
                                            <div style={{ marginTop: "10px", fontSize: "12px", color: "#d9534f", fontWeight: "bold" }}>
                                                {conflictWarning}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: "13px", color: "#44596f", textAlign: "center", fontStyle: "italic" }}>
                                        Select a nurse from the list above to assign or reassign.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Today's Assignments */}
                        <div className="table-box content-box">
                            <div className="box-header">
                                <h2 className="table-title">Assignments for {selectedDate}</h2>
                            </div>

                            <div style={{ maxHeight: "450px", overflowY: "auto", padding: "0 10px 10px 10px" }}>
                                {loading ? <div style={{ padding: "10px", color: "#44596f" }}>Loading...</div> :
                                    Object.keys(groupedAssignments).length > 0 ? (
                                        Object.keys(groupedAssignments).map(unit => (
                                            <div key={unit} style={{ marginBottom: "20px" }}>
                                                <h3 style={{ fontSize: "13px", background: "#dce4ed", padding: "8px 12px", borderRadius: "8px", color: "#2f3e55", marginBottom: "8px", textTransform: "uppercase" }}>
                                                    🏥 {unit} ({groupedAssignments[unit].length})
                                                </h3>
                                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ padding: "10px 12px", fontWeight: 600, color: "#2f3e55", textAlign: "left", boxShadow: "inset 0 -1px 0 rgba(74,106,133,0.15)" }}>Name</th>
                                                            <th style={{ padding: "10px 12px", fontWeight: 600, color: "#2f3e55", textAlign: "left", boxShadow: "inset 0 -1px 0 rgba(74,106,133,0.15)" }}>Shift</th>
                                                            <th style={{ padding: "10px 12px", fontWeight: 600, color: "#2f3e55", textAlign: "right", boxShadow: "inset 0 -1px 0 rgba(74,106,133,0.15)" }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {groupedAssignments[unit].map(assign => (
                                                            <tr key={assign.assignment_id} style={{ borderBottom: "1px solid rgba(74,106,133,0.08)", transition: "background 0.15s" }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                                                                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                                                                <td style={{ padding: "12px", color: "#1e293b", fontWeight: 600 }}>{assign.full_name}</td>
                                                                <td style={{ padding: "12px", color: "#475569" }}>{assign.shift}</td>
                                                                <td style={{ padding: "12px", textAlign: "right" }}>
                                                                    <button style={{ border: "none", background: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                                                                        onClick={() => handleRemove(assign.assignment_id, assign.nurse_id)}>
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))
                                    ) : <div style={{ padding: "10px", color: "#44596f" }}>No assignments made for this date yet.</div>}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {/* Reassign Modal */}
            {showReassignModal && reassignNurse && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '28px', minWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 6px', color: '#1e3a5f', fontSize: '18px' }}>Reassign Staff</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
                            Moving <strong>{reassignNurse.full_name}</strong> to a new unit
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>New Unit</label>
                                <select value={reassignUnit} onChange={e => setReassignUnit(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: 'white' }}>
                                    <option value="">Select unit...</option>
                                    {allUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleReassign} disabled={!reassignUnit}
                                style={{ flex: 1, padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: reassignUnit ? 'pointer' : 'not-allowed', opacity: reassignUnit ? 1 : 0.5 }}>
                                Confirm Reassign
                            </button>
                            <button onClick={() => setShowReassignModal(false)}
                                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}