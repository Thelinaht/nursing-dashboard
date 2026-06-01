import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";
import { io } from "socket.io-client";
import { Users, LayoutGrid, ClipboardCheck, ChevronRight, Download } from "lucide-react";

export default function SupervisorDashboard() {
    const navigate = useNavigate();
    const supervisorUnit = JSON.parse(sessionStorage.getItem("user"))?.unit || null;
    const [search, setSearch] = useState("");
    const [staffingSearch, setStaffingSearch] = useState("");
    const [nurses, setNurses] = useState([]);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [staffingFilter, setStaffingFilter] = useState("All Units");
    const [assignUnitFilters, setAssignUnitFilters] = useState([]);
    const [staffingUnitFilters, setStaffingUnitFilters] = useState([]);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    const [showStaffingDropdown, setShowStaffingDropdown] = useState(false);

    // Nurse-to-Patient Ratio Log state
    const [ratioLogs, setRatioLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('Today');
    const [showLogForm, setShowLogForm] = useState(false);
    const [logFormUnit, setLogFormUnit] = useState(supervisorUnit || '');
    const [logFormShift, setLogFormShift] = useState('Morning');
    const [logFormRatio, setLogFormRatio] = useState('');
    const [logFormNotes, setLogFormNotes] = useState('');
    const [logSuccess, setLogSuccess] = useState(false);

    const fetchRequests = () => {
        const unit = JSON.parse(sessionStorage.getItem("user"))?.unit || null;
        fetch("http://localhost:4000/api/requests")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const filtered = unit
                        ? data.filter(r => r.current_status === 'Pending_Supervisor' && r.unit === unit)
                        : data.filter(r => r.current_status === 'Pending_Supervisor');
                    setPendingRequests(filtered.length);
                }
            })
            .catch(err => console.error(err));
    };

    const fetchRatioLogs = async () => {
        try {
            const unit = JSON.parse(sessionStorage.getItem("user"))?.unit || null;
            const unitParam = unit ? `&unit=${encodeURIComponent(unit)}` : "";
            const res = await fetch(`http://localhost:4000/api/dashboard/ratio-logs?filter=${logFilter}${unitParam}`);
            const data = await res.json();
            setRatioLogs(data);
        } catch (err) {
            console.error("Error fetching ratio logs:", err);
        }
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();
        if (!logFormUnit || !logFormRatio) return;
        const user = JSON.parse(sessionStorage.getItem("user")) || {};
        const logged_by = user.user_id || 1;
        try {
            const res = await fetch("http://localhost:4000/api/dashboard/ratio-logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unit: logFormUnit,
                    shift: logFormShift,
                    actual_ratio: logFormRatio,
                    notes: logFormNotes,
                    logged_by,
                    timestamp: new Date().toISOString()
                })
            });
            if (res.ok) {
                setLogFormUnit('');
                setLogFormShift('Morning');
                setLogFormRatio('');
                setLogFormNotes('');
                setShowLogForm(false);
                setLogSuccess(true);
                setTimeout(() => setLogSuccess(false), 5000);
                fetchRatioLogs();
            }
        } catch (err) {
            console.error("Error submitting log:", err);
        }
    };

    const exportLogsToExcel = () => {
        const csvRows = [];
        csvRows.push(['Unit', 'Required ratio', 'Logged ratio', 'Shift', 'Status', 'Logged by', 'Time'].join(','));
        ratioLogs.forEach(row => {
            csvRows.push([
                `"${row.unit_name}"`,
                `"${row.required_ratio || 'N/A'}"`,
                `"${row.logged_ratio}"`,
                row.shift,
                row.status,
                `"${row.logged_by_name || 'System'}"`,
                `"${new Date(row.timestamp).toLocaleString()}"`
            ].join(','));
        });
        const csvContent = '\uFEFF' + csvRows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'Nurse_Patient_Ratio_Log.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

    useEffect(() => {
        fetchRatioLogs();
    }, [logFilter]);

    // Filter nurses to supervisor's unit only
    const myNurses = supervisorUnit
        ? nurses.filter(n => n.unit === supervisorUnit)
        : nurses;

    // Calculate Top Stats — scoped to supervisor's unit
    const totalNurses = myNurses.length;
    const units = [...new Set(myNurses.map(n => n.unit).filter(Boolean))];
    const totalUnits = units.length;

    const assignedStaff = myNurses.map((nurse, index) => ({
        id: nurse.nurse_id || `0${index + 1}`,
        unit: nurse.unit || "Unassigned",
        name: nurse.full_name
    })).filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
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

    // Daily Staffing — scoped to supervisor's unit
    const dailyStaffing = units.map(unit => {
        const availableCount = myNurses.filter(n => n.unit === unit).length;
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
                            <p><LayoutGrid size={20} /> Your Unit</p>
                            <h1 style={{ fontSize: supervisorUnit && supervisorUnit.length > 12 ? '18px' : '32px', marginTop: '8px' }}>
                                {supervisorUnit || '—'}
                            </h1>
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

                    {/* Nurse-to-Patient Ratio Log */}
                    <div className="table-box content-box" style={{ marginTop: '24px', width: '100%' }}>
                        <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="content-box-title">Nurse-to-Patient Ratio Log</h2>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div className="filter-buttons" style={{ display: 'flex', gap: '5px' }}>
                                    {['Today', 'This Week', 'All Shifts'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setLogFilter(filter)}
                                            style={{
                                                padding: '6px 14px',
                                                fontSize: '12px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                backgroundColor: logFilter === filter ? 'var(--accent-blue)' : '#f1f5f9',
                                                color: logFilter === filter ? 'white' : '#64748b',
                                                fontWeight: logFilter === filter ? 600 : 500,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="add-nurse-btn"
                                    style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}
                                    onClick={exportLogsToExcel}
                                >
                                    <Download size={14} />
                                    Export to Excel
                                </button>
                            </div>
                        </div>

                        <div className="custom-table" style={{ marginTop: '15px' }}>
                            <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr', fontSize: '14px' }}>
                                <span>Unit</span>
                                <span>Required ratio</span>
                                <span>Logged ratio</span>
                                <span>Shift</span>
                                <span style={{ textAlign: 'center' }}>Status</span>
                                <span>Logged by</span>
                                <span>Time</span>
                            </div>
                            <div style={{ minHeight: '150px', maxHeight: '300px', overflowY: 'auto' }}>
                                {ratioLogs.length > 0 ? ratioLogs.map((row, idx) => (
                                    <div className="table-row premium-row" key={idx} style={{
                                        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr',
                                        padding: '12px 15px',
                                        marginBottom: '8px',
                                        alignItems: 'center',
                                        fontSize: '14px',
                                        backgroundColor: row.status === 'Compliant' ? '#f0fdf4' : row.status === 'Borderline' ? '#fffbeb' : '#fef2f2'
                                    }}>
                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{row.unit_name}</span>
                                        <span style={{ color: '#64748b' }}>{row.required_ratio || 'N/A'}</span>
                                        <span style={{ fontWeight: 600 }}>{row.logged_ratio}</span>
                                        <span>{row.shift}</span>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <span className="badge" style={{
                                                backgroundColor: row.status === 'Compliant' ? '#dcfce7' : row.status === 'Borderline' ? '#fef3c7' : '#fee2e2',
                                                color: row.status === 'Compliant' ? '#16a34a' : row.status === 'Borderline' ? '#d97706' : '#dc2626',
                                                margin: 0, padding: '4px 10px', fontSize: '12px', width: 'max-content'
                                            }}>
                                                {row.status}
                                            </span>
                                        </div>
                                        <span style={{ color: '#475569' }}>{row.logged_by_name || 'System'}</span>
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(row.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#8ea2b5' }}>
                                        No ratio logs found for this period.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Log Form */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                            {logSuccess && (
                                <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', fontWeight: 500 }}>
                                    ✓ Nurse-to-Patient Ratio Logged Successfully! Notification sent to your notifications tab.
                                </div>
                            )}
                            <button
                                className="add-nurse-btn"
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '13px',
                                    background: showLogForm ? 'var(--text-primary)' : 'var(--accent-blue)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onClick={() => setShowLogForm(!showLogForm)}
                            >
                                {showLogForm ? 'Hide Form' : "Log Today's Ratio"}
                            </button>
                            {showLogForm && (
                                <form onSubmit={handleLogSubmit} style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Unit</label>
                                        <input
                                            value={supervisorUnit || logFormUnit}
                                            disabled
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f1f5f9', color: '#2f3e55', fontWeight: 600, cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Shift</label>
                                        <select required value={logFormShift} onChange={e => setLogFormShift(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}>
                                            <option value="Morning">Morning</option>
                                            <option value="Evening">Evening</option>
                                            <option value="Night">Night</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '100px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Actual Ratio</label>
                                        <input required type="text" placeholder="e.g. 1:3" value={logFormRatio} onChange={e => setLogFormRatio(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2, minWidth: '200px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Notes (optional)</label>
                                        <input type="text" placeholder="Add notes..." value={logFormNotes} onChange={e => setLogFormNotes(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }} />
                                    </div>
                                    <button type="submit" className="add-nurse-btn" style={{ padding: '10px 24px', fontSize: '13px', height: '40px' }}>
                                        Submit
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}