import { useState } from "react";

/**
 * DecisionModal — reusable for Supervisor / Assistant Director / Director
 * Props: isOpen, onClose, onSubmit(fn receives {decision, comment}), title
 */
export default function DecisionModal({ isOpen, onClose, onSubmit, title = "Decision" }) {
    const [decision, setDecision] = useState("");
    const [comment, setComment] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!decision) { alert("Please select a decision."); return; }
        if (!comment.trim()) { alert("Please write a comment."); return; }
        onSubmit({ decision, comment });
        setDecision("");
        setComment("");
        onClose();
    };

    const handleClose = () => {
        setDecision("");
        setComment("");
        onClose();
    };

    const OPTIONS = [
        { value: "Approved", label: "Approved", color: "#12b76a" },
        { value: "For_Discussion", label: "For Discussion", color: "#f79009" },
        { value: "Not_Approved", label: "Not Approved", color: "#f04438" },
    ];

    return (
        <div style={s.overlay} onClick={handleClose}>
            <div style={s.card} onClick={e => e.stopPropagation()}>
                <div style={s.header}>
                    <h3 style={s.title}>{title}</h3>
                    <button style={s.closeBtn} onClick={handleClose}>✕</button>
                </div>

                <p style={s.label}>Select Decision</p>
                <div style={s.btnRow}>
                    {OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            style={{
                                ...s.decisionBtn,
                                border: `2px solid ${opt.color}`,
                                color: decision === opt.value ? "#fff" : opt.color,
                                background: decision === opt.value ? opt.color : "transparent",
                            }}
                            onClick={() => setDecision(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <p style={s.label}>
                    Comment <span style={{ color: "#8ea2b5", fontWeight: 400, fontSize: 12 }}>(required)</span>
                </p>
                <textarea
                    style={s.textarea}
                    placeholder="Write your comment here..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={4}
                />

                <div style={s.actions}>
                    <button style={s.cancelBtn} onClick={handleClose}>Cancel</button>
                    <button style={s.submitBtn} onClick={handleSubmit}>Submit Decision</button>
                </div>
            </div>
        </div>
    );
}

const s = {
    overlay: {
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
    },
    card: {
        background: "#fff", borderRadius: "16px", padding: "28px",
        width: "100%", maxWidth: "480px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    },
    header: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "20px",
    },
    title: { margin: 0, fontSize: "17px", fontWeight: 700, color: "#1a2b3c" },
    closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#8ea2b5" },
    label: { fontSize: "13px", fontWeight: 600, color: "#314259", marginBottom: "8px", marginTop: "16px" },
    btnRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
    decisionBtn: {
        flex: 1, minWidth: "120px", padding: "10px 14px",
        borderRadius: "10px", fontSize: "13px", fontWeight: 600,
        cursor: "pointer", transition: "background 0.15s, color 0.15s",
    },
    textarea: {
        width: "100%", boxSizing: "border-box",
        border: "1.5px solid #e0e7ef", borderRadius: "10px",
        padding: "12px", fontSize: "14px", color: "#314259",
        resize: "vertical", outline: "none", fontFamily: "inherit",
    },
    actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" },
    cancelBtn: {
        padding: "10px 20px", borderRadius: "10px", border: "none",
        background: "#e0e7ef", color: "#314259", fontWeight: 600,
        cursor: "pointer", fontSize: "13px",
    },
    submitBtn: {
        padding: "10px 20px", borderRadius: "10px", border: "none",
        background: "#314259", color: "#fff", fontWeight: 600,
        cursor: "pointer", fontSize: "13px",
    },
};