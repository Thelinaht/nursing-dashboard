
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
    Calendar,
    RefreshCw,
    FileText,
    Home,
    GraduationCap,
    AlertCircle,
    Clock,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import "../styles/RequestPage.css";

const requests = [
    {
        label: "Leave Request",
        subtitle: "Request time off or annual leave",
        path: "/request/leave",
        icon: <Calendar size={32} />,
    },
    {
        label: "Shift Swap",
        subtitle: "Trade shifts with a colleague",
        path: "/request/shift-swap",
        icon: <RefreshCw size={32} />,
    },
    {
        label: "Document Update",
        subtitle: "Renew or update official papers",
        path: "/request/document-update",
        icon: <FileText size={32} />,
    },
    {
        label: "Unit Transfer",
        subtitle: "Apply for a different department",
        path: "/request/unit-transfer",
        icon: <Home size={32} />,
    },
    {
        label: "Training Request",
        subtitle: "Enroll in new courses or workshops",
        path: "/request/training",
        icon: <GraduationCap size={32} />,
    },
    {
        label: "General Requests",
        subtitle: "Other inquiries or submissions",
        path: "/request/general",
        icon: <AlertCircle size={32} />,
    },
];

export default function RequestPage() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.user_id) return;

        fetch(`http://localhost:4000/api/nurses/user/${user.user_id}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name}>

            <div className="main">
                <button className="back-btn" onClick={() => navigate("/nurse-dashboard")} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ArrowLeft size={14} /> Back
                </button>

                <h1 style={{ marginTop: '10px', marginBottom: '40px' }}>Requests</h1>

                <p className="section-header">New Request</p>

                <div className="request-grid">
                    {requests.map((req) => (
                        <div
                            key={req.label}
                            className="request-card glass-card"
                            onClick={() => navigate(req.path)}
                            style={{
                                borderTop: `4px solid var(--accent-blue)`,
                                '--accent': 'var(--accent-blue)'
                            }}
                        >
                            <div className="req-icon-wrapper" style={{ backgroundColor: `var(--bg-main)`, color: 'var(--accent-blue)' }}>
                                {req.icon}
                            </div>
                            <span className="req-label">{req.label}</span>
                            <span className="req-subtitle">{req.subtitle}</span>
                        </div>
                    ))}
                </div>

                <div className="history-btn-container">
                    <button
                        className="history-btn-premium"
                        onClick={() => navigate("/request/history")}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Clock size={20} />
                            <span>Request History</span>
                        </div>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

        </Layout>
    );
}
