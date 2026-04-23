import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { FileText } from "lucide-react";
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
                // Map the localized supervisor decision into the request object for visual clarity on this dashboard
                const mappedData = reqData.map(req => {
                    const supervisorApproval = Array.isArray(appData) 
                        ? appData.find(a => a.request_id === req.request_id && a.approver_role === "Supervisor") 
                        : null;
                    
                    if (supervisorApproval && supervisorApproval.decision === "Approved") {
                        return { ...req, current_status: "Approved" };
                    }
                    if (req.current_status === "Pending") {
                        return { ...req, current_status: "Pending Final Approval" };
                    }
                    return req;
                });
                
                setRequests(mappedData);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
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
        : requests.filter(r => r.current_status === "Pending Supervisor");

    return (
        <Layout role="supervisor" logoSrc="/logo.png" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Supervisor"}>
            <div className="main">
                
                <div className="table-box content-box" style={{ flex: 1, marginTop: '20px' }}>
                    <div className="box-header">
                        <h2 className="content-box-title">{showAllHistory ? "All Requests" : "Pending Requests Management"}</h2>
                        <button
                            className="btn-pill"
                            style={{ background: 'var(--accent-blue)', color: 'white', gap: '5px', display: 'flex', alignItems: 'center' }}
                            onClick={() => setShowAllHistory(!showAllHistory)}
                        >
                            <FileText size={14} />
                            {showAllHistory ? "Show Pending Only" : "View All History"}
                        </button>
                    </div>
                    
                    <div className="custom-table" style={{ marginTop: '10px' }}>
                        <div className="table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.5fr' }}>
                            <span>Staff Name</span>
                            <span>Request Type</span>
                            <span>Submitted On</span>
                            <span style={{ textAlign: "center" }}>Attachment</span>
                            <span style={{ textAlign: "center" }}>{showAllHistory ? "Status / Actions" : "Actions"}</span>
                        </div>
                        
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {filtered.length > 0 ? filtered.map((req) => (
                                <div className="table-row premium-row" key={req.request_id} style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.5fr', padding: '12px 15px', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 500 }}>{req.nurse_name || req.full_name || `Nurse #${req.nurse_id}`}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{req.request_type}</span>
                                    <span style={{ fontSize: '11px' }}>{req.submission_date ? new Date(req.submission_date).toLocaleDateString() : '–'}</span>

                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button 
                                            title="View Attachment" 
                                            className="action-btn" 
                                            style={{ background: "#e2e8f0", color: "#4a6a85", padding: "4px 8px", fontSize: "14px", borderRadius: "6px" }} 
                                            onClick={() => alert("Attachment preview coming soon! (Backend upload handling required)")}
                                        >
                                            📎 View
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                        {req.current_status === "Pending Supervisor" ? (
                                            <>
                                                <button
                                                    className="btn-pill"
                                                    style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
                                                    onClick={() => handleApprove(req.request_id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn-pill"
                                                    style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}
                                                    onClick={() => handleRejectClick(req.request_id)}
                                                >
                                                    Deny
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`status ${req.current_status?.toLowerCase().replace(" ", "-")}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                                {req.current_status}
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
