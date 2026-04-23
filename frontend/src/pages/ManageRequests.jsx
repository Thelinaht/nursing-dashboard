import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/RequestHistory.css";

export default function ManageRequests() {
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("Pending");
    const [typeFilter, setTypeFilter] = useState("All");
    const [searchId, setSearchId] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 15;

    // Modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [rejectNotes, setRejectNotes] = useState("");

    const fetchRequests = () => {
        fetch(`http://localhost:4000/api/requests`)
            .then(res => res.json())
            .then(data => setRequests(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
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

    const filtered = requests.filter(r =>
        (statusFilter === "All" || r.current_status === statusFilter) &&
        (typeFilter === "All" || r.request_type === typeFilter) &&
        (searchId === "" || r.request_id?.toString().includes(searchId)) &&
        (searchDate === "" || r.submission_date?.includes(searchDate))
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const statuses = ["All", "Pending", "Approved", "Rejected"];
    const types = ["All", "Leave Request", "Shift Swap", "Document Update", "Unit Transfer", "Training Request", "General Request"];

    const statusClass = (s) => {
        if (s === "Approved") return "badge approved";
        if (s === "Rejected") return "badge rejected";
        return "badge pending";
    };

    return (
        <Layout role="supervisor" logoSrc="/logo.png" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Supervisor"}>
            <div className="main">
                <h2>Manage Requests</h2>

                <div className="rh-table-box">
                    <div className="rh-header-sup">
                        <div className="rh-col">
                            <span className="rh-col-title">Request ID</span>
                            <input className="rh-search" placeholder="Search" value={searchId} onChange={e => { setSearchId(e.target.value); setPage(1); }} />
                        </div>
                        <div className="rh-col">
                            <span className="rh-col-title">Nurse Name</span>
                        </div>
                        <div className="rh-col">
                            <span className="rh-col-title">Status ⇅</span>
                            <select className="rh-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                                {statuses.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="rh-col">
                            <span className="rh-col-title">Type ⇅</span>
                            <select className="rh-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                                {types.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="rh-col">
                            <span className="rh-col-title">Date</span>
                            <input className="rh-search" placeholder="Search" value={searchDate} onChange={e => { setSearchDate(e.target.value); setPage(1); }} />
                        </div>
                        <div className="rh-col">
                            <span className="rh-col-title">Attachment</span>
                        </div>
                        <div className="rh-col">
                            <span className="rh-col-title">Action</span>
                        </div>
                    </div>

                    {paginated.length > 0 ? paginated.map((r, i) => (
                        <div className="rh-row-sup" key={i}>
                            <div className="rh-cell">REQ-{String(r.request_id).padStart(3, "0")}</div>
                            <div className="rh-cell" style={{fontWeight: "bold"}}>{r.nurse_name || r.full_name || "Unknown"}</div>
                            <div className="rh-cell">
                                <span className={statusClass(r.current_status)}>{r.current_status}</span>
                            </div>
                            <div className="rh-cell">{r.request_type}</div>
                            <div className="rh-cell">
                                {r.submission_date ? new Date(r.submission_date).toLocaleDateString("en-GB") : "–"}
                            </div>
                            <div className="rh-cell">
                                <button 
                                    title="View Attachment" 
                                    className="action-btn" 
                                    style={{ background: "#637b95", padding: "6px 10px", fontSize: "14px", display: "flex", margin: "auto" }} 
                                    onClick={() => alert("Attachment preview coming soon!")}
                                >
                                    📎
                                </button>
                            </div>
                            <div className="rh-cell">
                                {r.current_status === "Pending" && (
                                    <div className="action-btns">
                                        <button className="action-btn approve-btn" onClick={() => handleApprove(r.request_id)}>Approve</button>
                                        <button className="action-btn reject-btn" onClick={() => handleRejectClick(r.request_id)}>Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: "20px", textAlign: "center", color: "#4a6070", fontSize: 14 }}>
                            No requests found.
                        </div>
                    )}

                    <div className="rh-pagination">
                        <div className="rh-pages">
                            <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                            <span className="pg-info">{page} / {totalPages}</span>
                            <button className="pg-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                        </div>
                        <div className="rh-rows-per">
                            <span>Rows per page</span>
                            <span className="rows-badge">{rowsPerPage}</span>
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
