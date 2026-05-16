import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { FileText } from "lucide-react";
import io from "socket.io-client";
import "../styles/RequestHistory.css";
// We use the same styles that the Director Dashboard uses for consistency
import "../styles/SupervisorDashboard.css";

export default function ManageRequests() {
    const [requests, setRequests] = useState([]);
    const [showAllHistory, setShowAllHistory] = useState(false);

    // Modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [rejectNotes, setRejectNotes] = useState("");

    const fetchRequests = async () => {
        try {
            const [reqRes, appRes] = await Promise.all([
                fetch("http://localhost:4000/api/requests"),
                fetch("http://localhost:4000/api/approvals")
            ]);
            
            const reqData = await reqRes.json();
            const appData = await appRes.json();

            if (Array.isArray(reqData)) {
                setRequests(reqData);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
        const socket = io("http://localhost:4000");
        socket.on("request_updated", fetchRequests);
        return () => {
            socket.off("request_updated");
            socket.disconnect();
        };
    }, []);

    const handleApprove = (requestId) => {
        fetch("http://localhost:4000/api/approvals/supervisor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id: requestId, decision: "Approved" })
        })
        .then(res => {
            if (res.ok) fetchRequests();
        })
        .catch(err => console.error("Approve error", err));
    };

    const handleRejectClick = (requestId) => {
        setSelectedRequestId(requestId);
        setRejectNotes("");
        setRejectModalOpen(true);
    };

    const submitReject = () => {
        if (!selectedRequestId) return;
        fetch("http://localhost:4000/api/approvals/supervisor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id: selectedRequestId, decision: "Rejected", notes: rejectNotes })
        })
        .then(res => {
            if (res.ok) fetchRequests();
            setRejectModalOpen(false);
            setSelectedRequestId(null);
        })
        .catch(err => console.error("Reject error", err));
    };

    // Filter requests based on toggle
    const filtered = showAllHistory 
        ? requests 
        : requests.filter(r => r.current_status === "Pending");

    return (
        <Layout role="supervisor" logoSrc="/logo.png" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Supervisor"}>
            <div className="main">
                
                <div className="info-card content-box" style={{ flex: 1, marginTop: '20px', display: 'flex', flexDirection: 'column', padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                    <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "10px", marginBottom: "15px" }}>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "var(--text-primary)" }}>{showAllHistory ? "All Requests" : "Pending Requests Management"}</h3>
                        <button
                            style={{ background: '#314259', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1e2b3c'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#314259'}
                            onClick={() => setShowAllHistory(!showAllHistory)}
                        >
                            <FileText size={14} />
                            {showAllHistory ? "Show Pending Only" : "View All History"}
                        </button>
                    </div>
                    
                    <div style={{ marginTop: '10px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                        <div className="nurse-table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.5fr', flexShrink: 0, padding: '16px 20px', backgroundColor: '#c7d5e5' }}>
                            <span>Staff Name</span>
                            <span>Request Type</span>
                            <span>Submitted On</span>
                            <span style={{ textAlign: "center" }}>Attachment</span>
                            <span style={{ textAlign: "center" }}>{showAllHistory ? "Status / Actions" : "Actions"}</span>
                        </div>
                        
                        <div>
                            {filtered.length > 0 ? filtered.map((req) => (
                                <div className="nurse-table-row" key={req.request_id} style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.5fr', padding: '16px 20px', transition: 'var(--transition-fast)' }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{req.full_name || `Nurse #${req.nurse_id}`}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{req.request_type}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{req.submission_date ? new Date(req.submission_date).toLocaleDateString() : '–'}</span>

                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button 
                                            title="View Attachment" 
                                            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", textDecoration: "underline", padding: 0 }} 
                                            onClick={() => alert("Attachment preview coming soon! (Backend upload handling required)")}
                                        >
                                            <span style={{ fontSize: '11px' }}>📎</span> View
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                        {req.current_status === "Pending" ? (
                                            <>
                                                <button
                                                    style={{ backgroundColor: 'var(--accent-green)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#10893a'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-green)'}
                                                    onClick={() => handleApprove(req.request_id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    style={{ backgroundColor: 'var(--accent-red)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b71c1c'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-red)'}
                                                    onClick={() => handleRejectClick(req.request_id)}
                                                >
                                                    Deny
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`status ${req.current_status?.toLowerCase().replace("_", "-")}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                                {req.current_status === "Pending" ? "Pending Supervisor" : (req.current_status === "Pending_Director" ? "Pending Director" : req.current_status)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#8ea2b5' }}>
                                    No requests found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {rejectModalOpen && (
                    <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Reject Request</h3>
                            <textarea 
                                placeholder="Reason for rejection (optional).."
                                value={rejectNotes}
                                onChange={e => setRejectNotes(e.target.value)}
                            />
                            <div className="modal-actions">
                                <button className="action-btn" style={{background: "#637b95"}} onClick={() => setRejectModalOpen(false)}>Cancel</button>
                                <button className="action-btn reject-btn" onClick={submitReject}>Confirm Reject</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
