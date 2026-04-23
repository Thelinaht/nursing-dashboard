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
    const rowsPerPage = 15;

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        const targetId = user?.nurse_id || user?.user_id;
        if (!targetId) return;

        fetch(`http://localhost:4000/api/nurses/${user?.user_id || targetId}`)
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

    const statuses = ["All", "Approved", "Rejected", "Pending", "Pending Supervisor"];
    const types = ["All", "Leave Request", "Shift Swap", "Document Update", "Unit Transfer", "Training Request", "General Request"];

    const statusClass = (s) => {
        if (s === "Approved") return "badge approved";
        if (s === "Rejected") return "badge rejected";
        return "badge pending";
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
                                <span className={statusClass(r.current_status)}>{r.current_status}</span>
                            </div>
                            <div className="rh-cell">{r.request_type}</div>
                            <div className="rh-cell">
                                {r.submission_date ? new Date(r.submission_date).toLocaleDateString("en-GB") : "–"}
                            </div>
                            <div className="rh-cell">
                                <button className="view-btn" onClick={() => setSelectedRequest(r)}>View</button>
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
                                    {selectedRequest.current_status}
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

                        {selectedRequest.request_type === "Leave Request" ? (
                            <>
                                {selectedRequest.title && (
                                    <div className="popup-section">
                                        <span className="popup-label" style={{ display: "block", marginBottom: 8 }}>Leave Type</span>
                                        <p className="popup-text">{selectedRequest.title}</p>
                                    </div>
                                )}
                                {selectedRequest.description && (
                                    <div className="popup-section">
                                        <span className="popup-label" style={{ display: "block", marginBottom: 8 }}>Details</span>
                                        {selectedRequest.description.split(", ").map((item, i) => {
                                            const parts = item.split(": ");
                                            const key = parts[0];
                                            const val = parts.slice(1).join(": ");
                                            return (
                                                <div className="popup-row" key={i}>
                                                    <span className="popup-label">{key}</span>
                                                    <span className="popup-val">{val}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {selectedRequest.description && (
                                    <div className="popup-section">
                                        <span className="popup-label">Staff Request</span>
                                        <p className="popup-text">{selectedRequest.description}</p>
                                    </div>
                                )}
                                {selectedRequest.title && (
                                    <div className="popup-section">
                                        <span className="popup-label">Reason</span>
                                        <p className="popup-text">{selectedRequest.title}</p>
                                    </div>
                                )}
                            </>
                        )}

                        <button className="popup-close-btn" onClick={() => setSelectedRequest(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

        </Layout>
    );
}
