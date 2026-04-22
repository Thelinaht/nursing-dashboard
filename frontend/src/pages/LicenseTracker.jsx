import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/LicenseTracker.css";

const BASE_URL = "http://localhost:4000";

export default function LicenseTracker() {
    const navigate = useNavigate();
    const [licenses, setLicenses] = useState([]);
    const [filter, setFilter] = useState("all"); // all | expired | critical | warning

    useEffect(() => {
        fetch(`${BASE_URL}/api/licenses/expiring`)
            .then(res => res.json())
            .then(data => setLicenses(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    const getStatus = (days) => {
        if (days < 0) return { label: "Expired", cls: "expired" };
        if (days <= 30) return { label: "Critical", cls: "critical" };
        if (days <= 90) return { label: "Warning", cls: "warning" };
        return { label: "OK", cls: "ok" };
    };

    const filtered = licenses.filter(l => {
        const days = Number(l.days_remaining);
        if (filter === "expired") return days < 0;
        if (filter === "critical") return days >= 0 && days <= 30;
        if (filter === "warning") return days > 30 && days <= 90;
        return true;
    });

    const counts = {
        expired: licenses.filter(l => Number(l.days_remaining) < 0).length,
        critical: licenses.filter(l => Number(l.days_remaining) >= 0 && Number(l.days_remaining) <= 30).length,
        warning: licenses.filter(l => Number(l.days_remaining) > 30 && Number(l.days_remaining) <= 90).length,
    };

    return (
              <Layout role="secretary" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}>

            <div className="lt-container">

                {/* Header */}
                <div className="lt-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                        <h1>License Tracker</h1>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="lt-summary">
                    <div className="lt-card expired-card" onClick={() => setFilter("expired")}>
                        <p>Expired</p>
                        <h2>{counts.expired}</h2>
                    </div>
                    <div className="lt-card critical-card" onClick={() => setFilter("critical")}>
                        <p>Critical (&lt;30 days)</p>
                        <h2>{counts.critical}</h2>
                    </div>
                    <div className="lt-card warning-card" onClick={() => setFilter("warning")}>
                        <p>Warning (&lt;90 days)</p>
                        <h2>{counts.warning}</h2>
                    </div>
                    <div className="lt-card all-card" onClick={() => setFilter("all")}>
                        <p>All</p>
                        <h2>{licenses.length}</h2>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="lt-tabs">
                    {["all", "expired", "critical", "warning"].map(f => (
                        <button
                            key={f}
                            className={`lt-tab ${filter === f ? "active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="lt-table">
                    <div className="lt-row header">
                        <span>Name</span>
                        <span>Unit</span>
                        <span>License No.</span>
                        <span>Expiry Date</span>
                        <span>Days Left</span>
                        <span>Status</span>
                    </div>

                    {filtered.length === 0 && (
                        <div className="lt-empty">No licenses found in this category.</div>
                    )}

                    {filtered.map(l => {
                        const days = Number(l.days_remaining);
                        const { label, cls } = getStatus(days);
                        return (
                            <div
                                key={l.license_id}
                                className="lt-row"
                                onClick={() => navigate(`/nurse/${l.user_id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <span className="lt-name">{l.full_name}</span>
                                <span>{l.unit || "—"}</span>
                                <span>{l.license_number}</span>
                                <span>{l.expiry_date?.split("T")[0]}</span>
                                <span className={`days-badge days-${cls}`}>
                                    {days < 0 ? `${Math.abs(days)} days ago` : `${days} days`}
                                </span>
                                <span className={`status-badge status-${cls}`}>{label}</span>
                            </div>
                        );
                    })}
                </div>

            </div>
        </Layout>
    );
}
