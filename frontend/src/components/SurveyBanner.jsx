import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";

export default function SurveyBanner() {
    const [pending, setPending] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const user = JSON.parse(sessionStorage.getItem("user"));
                if (!user || user.role_id === 4) return;
                const res = await fetch(
                    `http://localhost:4000/api/surveys/pending?user_id=${user.user_id}`
                );
                const data = await res.json();
                setPending(data.pending || []);
            } catch { }
        };
        fetchPending();
    }, []);

    if (pending.length === 0) return null;

    return (
        <div style={{ marginBottom: "20px" }}>
            <button
                onClick={() => navigate("/surveys")}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#334155",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "9px 16px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(51,65,85,0.25)",
                    position: "relative",
                    width: "auto",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
                onMouseLeave={e => e.currentTarget.style.background = "#334155"}
            >
                <span style={{
                    position: "absolute",
                    top: "7px",
                    right: "8px",
                    width: "8px",
                    height: "8px",
                    background: "#ef4444",
                    borderRadius: "50%",
                    border: "2px solid #334155",
                }} />
                <ClipboardList size={16} />
                Annual Survey Pending ({pending.length})
            </button>
        </div>
    );
}