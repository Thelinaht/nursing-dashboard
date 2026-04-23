import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/TrainingPage.css";

export default function TrainingPage() {
    const [nurse, setNurse] = useState(null);
    const [trainings, setTrainings] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [actionFilter, setActionFilter] = useState("All");
    const [searchName, setSearchName] = useState("");
    const [searchDate, setSearchDate] = useState("");

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.user_id) return;

        fetch(`http://localhost:4000/api/nurses/${user.user_id}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));

        fetch(`http://localhost:4000/api/training/${user.user_id}`)
            .then(res => res.json())
            .then(data => {
                console.log("TRAINING DATA:", data);
                setTrainings(data?.rows ?? []);
            })
            .catch(err => console.error(err));
    }, []);

    const getAction = (status) => {
        if (status === "Completed") return "View";
        if (status === "Overdue") return "Start";
        if (status === "In Progress") return "Continue";
        return "Start";
    };

    const statusClass = (s) => {
        if (s === "Completed") return "tbadge complete";
        if (s === "Overdue") return "tbadge overdue";
        if (s === "In Progress") return "tbadge inprogress";
        return "tbadge pending";
    };

    const filtered = trainings.filter(t =>
        (statusFilter === "All" || t.status === statusFilter) &&
        (actionFilter === "All" || getAction(t.status) === actionFilter) &&
        (searchName === "" || t.training_name?.toLowerCase().includes(searchName.toLowerCase())) &&
        (searchDate === "" || t.due_date?.includes(searchDate))
    );

    const statuses = ["All", "Completed", "Pending", "Overdue", "In Progress"];
    const actions = ["All", "View", "Start", "Continue"];

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "–";

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name}>
            <div className="main">
                <h2>Training</h2>

                <div className="tr-table-box">
                    {/* Header / Filters */}
                    <div className="tr-header">
                        <div className="tr-col">
                            <span className="tr-col-title">Course Name</span>
                            <input
                                className="tr-search"
                                placeholder="Search"
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                            />
                        </div>
                        <div className="tr-col">
                            <span className="tr-col-title">Status ⇅</span>
                            <select className="tr-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                {statuses.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="tr-col">
                            <span className="tr-col-title">Due Date</span>
                            <input
                                className="tr-search"
                                placeholder="Search"
                                value={searchDate}
                                onChange={e => setSearchDate(e.target.value)}
                            />
                        </div>
                        <div className="tr-col">
                            <span className="tr-col-title">Action ⇅</span>
                            <select className="tr-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                                {actions.map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Rows */}
                    {filtered.length > 0 ? filtered.map((t, i) => (
                        <div className="tr-row" key={i}>
                            <div className="tr-cell">{t.training_name}</div>
                            <div className="tr-cell">
                                <span className={statusClass(t.status)}>{t.status}</span>
                            </div>
                            <div className="tr-cell">
                                <span className="date-badge">{formatDate(t.due_date)}</span>
                            </div>
                            <div className="tr-cell">
                                <button className="action-btn">{getAction(t.status)}</button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: "20px", textAlign: "center", color: "#4a6070", fontSize: 14 }}>
                            No training records found.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
