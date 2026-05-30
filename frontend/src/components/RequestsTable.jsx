import { useState } from "react";
import { FileText } from "lucide-react";
import DecisionModal from "./DecisionModal";
import "../styles/ResearcherDashboard.css";

const STATUS_LABELS = {
    Pending_Supervisor: "Pending Supervisor",
    Pending_Assistant: "Pending Assistant",
    Pending_Director: "Pending Director",
    Approved: "Approved",
    For_Discussion: "For Discussion",
    Not_Approved: "Not Approved",
};

const STATUS_BADGE = {
    Pending_Supervisor: "rd-badge rd-badge-amber",
    Pending_Assistant: "rd-badge rd-badge-amber",
    Pending_Director: "rd-badge rd-badge-amber",
    Approved: "rd-badge rd-badge-green",
    For_Discussion: "rd-badge rd-badge-blue",
    Not_Approved: "rd-badge rd-badge-red",
};

const STATUS_COLORS = {
    Pending_Supervisor: "#f79009",
    Pending_Assistant: "#f79009",
    Pending_Director: "#f79009",
    Approved: "#12b76a",
    For_Discussion: "#0ba5ec",
    Not_Approved: "#f04438",
};

export default function RequestsTable({
    requests,
    pendingStatus,
    apiEndpoint,
    modalTitle,
    onRefresh,
    showHistory,
    onToggleHistory,
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [trailModal, setTrailModal] = useState(null);

    const filtered = showHistory
        ? requests
        : requests.filter(r => r.current_status === pendingStatus);

    const openDecision = (id) => { setSelectedId(id); setModalOpen(true); };

    const submitDecision = async ({ decision, comment }) => {
        await fetch(`http://localhost:4000${apiEndpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id: selectedId, decision, comment }),
        });
        onRefresh();
    };

    const viewTrail = async (req) => {
        const [appRes, attRes] = await Promise.all([
            fetch(`http://localhost:4000/api/approvals/request/${req.request_id}`),
            fetch(`http://localhost:4000/api/requests/${req.request_id}/attachments`),
        ]);
        const approvals = await appRes.json();
        const attachments = await attRes.json();
        setTrailModal({ request: req, approvals, attachments });
    };

    return (
        <>
            {/* Card wrapper */}
            <div className="content-box" style={{ padding: "24px" }}>

                {/* Top bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {showHistory ? "All Requests" : "Pending Requests Management"}
                    </h3>
                    <button className="rd-primary-btn" onClick={onToggleHistory}>
                        <FileText size={14} />
                        {showHistory ? "Show Pending Only" : "View All History"}
                    </button>
                </div>

                {/* Table */}
                <div className="rd-table-scroll">
                    <table className="rd-table">
                        <thead>
                            <tr className="rd-thead-row">
                                <th className="rd-th-sticky">Staff Name</th>
                                <th className="rd-th-sticky">Request Type</th>
                                <th className="rd-th-sticky">Submitted On</th>
                                <th className="rd-th-sticky">Status</th>
                                <th className="rd-th-sticky">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="rd-empty-td">No requests found.</td>
                                </tr>
                            ) : filtered.map(req => (
                                <tr className="rd-tr" key={req.request_id}>
                                    <td className="rd-td rd-td--title">{req.full_name || `Nurse #${req.nurse_id}`}</td>
                                    <td className="rd-td">{req.request_type}</td>
                                    <td className="rd-td">
                                        {req.submission_date
                                            ? new Date(req.submission_date).toLocaleDateString("en-GB")
                                            : "–"}
                                    </td>
                                    <td className="rd-td">
                                        <span className={STATUS_BADGE[req.current_status] || "rd-badge rd-badge-amber"}>
                                            {STATUS_LABELS[req.current_status] || req.current_status}
                                        </span>
                                    </td>
                                    <td className="rd-td">
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <button className="rd-edit-btn" onClick={() => viewTrail(req)}>
                                                View
                                            </button>
                                            {req.current_status === pendingStatus && (
                                                <button
                                                    className="rd-primary-btn"
                                                    style={{ padding: "6px 14px", fontSize: 12 }}
                                                    onClick={() => openDecision(req.request_id)}
                                                >
                                                    Decide
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Decision modal */}
            <DecisionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={submitDecision}
                title={modalTitle}
            />

            {/* Trail / Detail modal */}
            {trailModal && (
                <div style={s.overlay} onClick={() => setTrailModal(null)}>
                    <div style={s.trailCard} onClick={e => e.stopPropagation()}>
                        <div style={s.trailHeader}>
                            <h3 style={{ margin: 0, fontSize: 16, color: "#1a2b3c" }}>
                                REQ-{String(trailModal.request.request_id).padStart(3, "0")} — {trailModal.request.request_type}
                            </h3>
                            <button style={s.closeBtn} onClick={() => setTrailModal(null)}>✕</button>
                        </div>

                        <div style={s.trailMeta}>
                            <span><b>Staff:</b> {trailModal.request.full_name}</span>
                            <span><b>Submitted:</b> {trailModal.request.submission_date
                                ? new Date(trailModal.request.submission_date).toLocaleDateString("en-GB")
                                : "–"}</span>
                            <span>
                                <b>Status:</b>{" "}
                                <span style={{ color: STATUS_COLORS[trailModal.request.current_status] }}>
                                    {STATUS_LABELS[trailModal.request.current_status] || trailModal.request.current_status}
                                </span>
                            </span>
                        </div>

                        {trailModal.request.description && (
                            <div style={s.trailSection}>
                                <p style={s.trailSectionTitle}>Request Details</p>
                                <p style={s.trailText}>{trailModal.request.description}</p>
                            </div>
                        )}

                        {trailModal.attachments?.length > 0 && (
                            <div style={s.trailSection}>
                                <p style={s.trailSectionTitle}>Attachments</p>
                                {trailModal.attachments.map(att => (
                                    <a
                                        key={att.attachment_id}
                                        href={`http://localhost:4000/${att.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={s.attachLink}
                                    >
                                        📎 {att.file_name}
                                    </a>
                                ))}
                            </div>
                        )}

                        <p style={s.trailSectionTitle}>Approval Trail</p>
                        {trailModal.approvals.length === 0 ? (
                            <p style={{ color: "#8ea2b5", fontSize: 14 }}>No decisions recorded yet.</p>
                        ) : trailModal.approvals.map(a => (
                            <div key={a.approval_id} style={s.trailItem}>
                                <div style={s.trailRole}>{a.approver_role}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span className={STATUS_BADGE[a.decision] || "rd-badge rd-badge-amber"}
                                        style={{ fontSize: 11 }}>
                                        {a.decision === "Pending" ? "Awaiting" : a.decision.replace("_", " ")}
                                    </span>
                                    {a.decision_date && (
                                        <span style={{ fontSize: 12, color: "#8ea2b5" }}>
                                            {new Date(a.decision_date).toLocaleDateString("en-GB")}
                                        </span>
                                    )}
                                </div>
                                {a.notes && (
                                    <p style={s.trailComment}>💬 "{a.notes}"</p>
                                )}
                            </div>
                        ))}

                        <button style={s.closeBtnFull} onClick={() => setTrailModal(null)}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
}

const s = {
    overlay: {
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    },
    trailCard: {
        background: "#fff", borderRadius: "16px", padding: "28px",
        width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    },
    trailHeader: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "16px",
    },
    trailMeta: {
        display: "flex", flexDirection: "column", gap: 6,
        fontSize: 14, color: "#637b95", marginBottom: 16,
        padding: "12px 16px", background: "#f8fafc", borderRadius: 10,
    },
    trailSection: { marginBottom: 16 },
    trailSectionTitle: { fontSize: 13, fontWeight: 700, color: "#314259", margin: "16px 0 8px" },
    trailText: { fontSize: 14, color: "#637b95", margin: 0 },
    trailItem: {
        padding: "14px 16px", background: "#f8fafc",
        borderRadius: 10, marginBottom: 8,
        display: "flex", flexDirection: "column", gap: 6,
    },
    trailRole: { fontSize: 13, fontWeight: 700, color: "#314259" },
    trailComment: { fontSize: 13, color: "#637b95", margin: 0, fontStyle: "italic" },
    attachLink: {
        display: "block", marginBottom: 6,
        fontSize: 13, color: "#314259", fontWeight: 500,
        textDecoration: "underline", cursor: "pointer",
    },
    closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#8ea2b5" },
    closeBtnFull: {
        marginTop: 20, width: "100%", padding: "12px",
        borderRadius: 10, border: "none", background: "#e0e7ef",
        color: "#314259", fontWeight: 600, fontSize: 14, cursor: "pointer",
    },
};