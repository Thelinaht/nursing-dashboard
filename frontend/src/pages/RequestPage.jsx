import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/RequestPage.css";

const requests = [
    {
        label: "Leave Request",
        path: "/request/leave",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#2f3e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        label: "Shift Swap",
        path: "/request/shift-swap",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#2f3e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
        ),
    },
    {
        label: "Document Update",
        path: "/request/document-update",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#2f3e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        ),
    },
    {
        label: "Unit Transfer",
        path: "/request/unit-transfer",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#2f3e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        label: "Training Request",
        path: "/request/training",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#2f3e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
    },
    {
        label: "General Requests",
        path: "/request/general",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#2f3e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
    },
];

export default function RequestPage() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.user_id) return;

        fetch(`http://localhost:4000/api/nurses/${user.user_id}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name}>

            <div className="main">
                <h2>Requests</h2>

                <p className="section-title">New Request</p>

                <div className="request-grid">
                    {requests.map((req) => (
                        <button
                            key={req.label}
                            className="request-btn"
                            onClick={() => navigate(req.path)}
                        >
                            <div className="req-icon">{req.icon}</div>
                            <span className="req-label">{req.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    className="history-btn"
                    onClick={() => navigate("/request/history")}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2f3e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Request History
                </button>
            </div>

        </Layout>
    );
}
