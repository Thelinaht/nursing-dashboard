import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/RequestHistory.css";

export default function RequestHistory() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [searchId, setSearchId] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [page, setPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approvalTrail, setApprovalTrail] = useState([]);

    const openRequest = async (r) => {
        setSelectedRequest(r);
        try {
            const res = await fetch(`http://localhost:4000/api/approvals/request/${r.request_id}`);
            const data = await res.json();
            setApprovalTrail(Array.isArray(data) ? data : []);
        } catch { setApprovalTrail([]); }
    };
    const rowsPerPage = 15;

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        const targetId = user?.nurse_id || user?.user_id;
        if (!targetId) return;

        fetch(`http://localhost:4000/api/nurses/${targetId === user?.user_id ? 'user/' + targetId : targetId}`)
            .then(res => res.json())
            .then(data => setNurse(data));

        fetch(`http://localhost:4000/api/requests/nurse/${targetId}`)
            .then(res => res.json())
            .then(data => setRequests(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, []);

    const filtered = requests.filter(r =>
        (statusFilter === "All" || r.current_status === statusFilter) &&
        (typeFilter === "All" || r.request_type === typeFilter) &&
        (searchId === "" || r.request_id?.toString().includes(searchId)) &&
        (searchDate === "" || r.submission_date?.includes(searchDate))
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const statuses = ["All", "Approved", "Not_Approved", "For_Discussion", "Pending_Supervisor", "Pending_Assistant", "Pending_Director"];
    const types = ["All", "Leave Request", "Shift Swap", "Document Update", "Unit Transfer", "Training Request", "General Request"];

    const STATUS_LABELS = {
        Pending_Supervisor: "Pending Supervisor",
        Pending_Assistant: "Pending Assistant",
        Pending_Director: "Pending Director",
        Approved: "Approved",
        For_Discussion: "For Discussion",
        Not_Approved: "Not Approved",
    };
    const statusClass = (s) => {
        if (s === "Approved") return "status approved";
        if (s === "Not_Approved") return "status rejected";
        if (s === "For_Discussion") return "status pending-director";
        return "status pending";
    };

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name}>
            <div className="main">
                <button className="back-btn" onClick={() => navigate("/request")}>
                    ← Back
                </button>

                <h2>Request History</h2>

                <div className="rh-table-box">
                    <div className="rh-header">
                        <div className="rh-col">
                            <span className="rh-col-title">Request ID</span>
                            <input className="rh-search" placeholder="Search" value={searchId} onChange={e => { setSearchId(e.target.value); setPage(1); }} />
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
                            <span className="rh-col-title">Action</span>
                        </div>
                    </div>

                    {paginated.length > 0 ? paginated.map((r, i) => (
                        <div className="rh-row" key={i}>
                            <div className="rh-cell">REQ-{String(r.request_id).padStart(3, "0")}</div>
                            <div className="rh-cell">
                                <span className={statusClass(r.current_status)}>
                                    {STATUS_LABELS[r.current_status] || r.current_status}
                                </span>
                            </div>
                            <div className="rh-cell">{r.request_type}</div>
                            <div className="rh-cell">
                                {r.submission_date ? new Date(r.submission_date).toLocaleDateString("en-GB") : "–"}
                            </div>
                            <div className="rh-cell">
                                <button className="view-btn" onClick={() => openRequest(r)}>View</button>
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
                            <span className="rows-badge">{paginated.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup */}
            {selectedRequest && (
                <div className="popup-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="popup-card" onClick={e => e.stopPropagation()}>
                        <div className="popup-header">
                            <h3>REQ-{String(selectedRequest.request_id).padStart(3, "0")}</h3>
                            <button className="popup-close" onClick={() => setSelectedRequest(null)}>✕</button>
                        </div>

                        <div className="popup-row">
                            <span className="popup-label">Type</span>
                            <span className="popup-val">{selectedRequest.request_type}</span>
                        </div>
                        <div className="popup-row">
                            <span className="popup-label">Status</span>
                            <div style={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
                                <span className={statusClass(selectedRequest.current_status)}>
                                    {STATUS_LABELS[selectedRequest.current_status] || selectedRequest.current_status}
                                </span>
                            </div>
                        </div>
                        <div className="popup-row">
                            <span className="popup-label">Date</span>
                            <span className="popup-val">
                                {selectedRequest.submission_date
                                    ? new Date(selectedRequest.submission_date).toLocaleDateString("en-GB")
                                    : "–"}
                            </span>
                        </div>

                        {selectedRequest.description && (
                            <div className="popup-section">
                                <span className="popup-label" style={{ display: "block", marginBottom: 8 }}>Details</span>
                                <p className="popup-text">{selectedRequest.description}</p>
                            </div>
                        )}

                        {/* Director final decision only */}
                        {(() => {
                            const directorDecision = approvalTrail.find(a => a.approver_role === "Director" && a.decision !== "Pending");
                            if (!directorDecision) return (
                                <div className="popup-section" style={{ marginTop: 16 }}>
                                    <span className="popup-label" style={{ display: "block", marginBottom: 8 }}>Final Decision</span>
                                    <p className="popup-text" style={{ color: "#8ea2b5" }}>Awaiting final decision from the Director.</p>
                                </div>
                            );
                            return (
                                <div className="popup-section" style={{ marginTop: 16 }}>
                                    <span className="popup-label" style={{ display: "block", marginBottom: 10 }}>Final Decision</span>
                                    <div style={{
                                        background: "#f8fafc", borderRadius: 10,
                                        padding: "14px 16px",
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: directorDecision.notes ? 8 : 0 }}>
                                            <span style={{ fontWeight: 700, fontSize: 13, color: "#314259" }}>Director of Nursing</span>
                                            <span style={{
                                                padding: "4px 12px", borderRadius: 20,
                                                fontSize: 12, fontWeight: 600,
                                                background: directorDecision.decision === "Approved" ? "#12b76a22"
                                                    : directorDecision.decision === "Not_Approved" ? "#f0443822"
                                                        : "#f7900922",
                                                color: directorDecision.decision === "Approved" ? "#12b76a"
                                                    : directorDecision.decision === "Not_Approved" ? "#f04438"
                                                        : "#f79009",
                                            }}>
                                                {directorDecision.decision.replace("_", " ")}
                                            </span>
                                        </div>
                                        {directorDecision.notes && (
                                            <p style={{ margin: 0, fontSize: 13, color: "#637b95", fontStyle: "italic" }}>
                                                💬 "{directorDecision.notes}"
                                            </p>
                                        )}
                                        {directorDecision.decision_date && (
                                            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#8ea2b5" }}>
                                                {new Date(directorDecision.decision_date).toLocaleDateString("en-GB")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        <button className="popup-close-btn" onClick={() => setSelectedRequest(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

        </Layout>
    );
}