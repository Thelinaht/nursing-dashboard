import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/RequestHistory.css";

export default function RequestHistory() {
    const [nurse, setNurse] = useState(null);
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [searchId, setSearchId] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 15;

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.user_id) return;

        fetch(`http://localhost:4000/api/nurses/${user.user_id}`)
            .then(res => res.json())
            .then(data => setNurse(data));

        fetch(`http://localhost:4000/api/requests/nurse/${user.user_id}`)
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

    const statuses = ["All", "Approved", "Rejected", "Pending"];
    const types = ["All", "Leave Request", "Shift Swap", "Document Update", "Unit Transfer", "Training Request", "General Request"];

    const statusClass = (s) => {
        if (s === "Approved") return "badge approved";
        if (s === "Rejected") return "badge rejected";
        return "badge pending";
    };

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name}>
            <div className="main">
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
                            <div className="rh-cell"><button className="view-btn">View</button></div>
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
            </div>
        </Layout>
    );
}
