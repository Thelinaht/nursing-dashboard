import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/StaffQualification.css";

const BASE_URL = "http://localhost:4000";

const CATEGORIES = [
    "Mandatory",
    "Inside Hospital",
    "Outside Hospital",
    "Cross Training",
    "Competency"
];

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed", "Expired", "Overdue"];

export default function StaffQualification() {
    const navigate = useNavigate();
    const { id } = useParams(); // user_id

    const [rows, setRows] = useState([]);
    const [nurseId, setNurseId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Mandatory");
    const fileRefs = useRef({});
    const saudiFileRef = useRef();

    // Saudi Council state
    const [saudiLicense, setSaudiLicense] = useState(null);
    const [saudiEditing, setSaudiEditing] = useState(false);
    const [saudiSaving, setSaudiSaving] = useState(false);

    useEffect(() => {
        fetch(`${BASE_URL}/api/licenses/nurse/${id}`)
            .then(res => res.json())
            .then(data => setSaudiLicense(data))
            .catch(console.error);
    }, [id]);

    useEffect(() => {
        fetch(`${BASE_URL}/api/training/${id}`)
            .then(res => res.json())
            .then(result => {
                if (result.rows) {
                    setRows(result.rows);
                    setNurseId(result.nurseId);
                }
            })
            .catch(console.error);
    }, [id]);

    const handleChange = (trainingId, field, value) => {
        setRows(prev => prev.map(r =>
            r.training_id === trainingId ? { ...r, [field]: value } : r
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const filtered = rows.filter(r => r.training_category === activeCategory);

            const handleSaudiSave = async () => {
                setSaudiSaving(true);
                try {
                    const res = await fetch(`${BASE_URL}/api/licenses/nurse/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            license_number: saudiLicense?.license_number || null,
                            expiry_date: saudiLicense?.expiry_date?.split("T")[0] || null
                        })
                    });
                    const data = await res.json();
                    if (data.success) { setSaudiEditing(false); alert("Saved ✅"); }
                    else alert("❌ " + data.error);
                } catch (err) {
                    alert("❌ Save failed");
                } finally {
                    setSaudiSaving(false);
                }
            };

            const handleSaudiUpload = async (file) => {
                if (!file) return;
                const form = new FormData();
                form.append("file", file);
                try {
                    const res = await fetch(`${BASE_URL}/api/licenses/nurse/${id}/upload`, {
                        method: "POST",
                        body: form
                    });
                    const data = await res.json();
                    if (data.success) {
                        setSaudiLicense(prev => ({ ...prev, certificate_file_path: data.path }));
                        alert("✅ Certificate uploaded");
                    } else alert("❌ " + data.error);
                } catch (err) {
                    alert("❌ Network error");
                }
            };
            for (const item of filtered) {
                await fetch(`${BASE_URL}/api/training`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nurse_id: nurseId,
                        training_id: item.training_id,
                        expiry_date: item.expiry_date || null,
                        recommendation_action_plan: item.recommendation_action_plan || null,
                        status: item.status || "Pending"
                    })
                });
            }
            setIsEditing(false);
            alert("Saved ✅");
        } catch (err) {
            console.error(err);
            alert("❌ Save failed: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (trainingId, file) => {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/api/training/certificate/${id}/${trainingId}`, {
                method: "POST",
                body: form
            });
            const data = await res.json();
            if (data.success) {
                setRows(prev => prev.map(r =>
                    r.training_id === trainingId
                        ? { ...r, certificate_file_path: data.path }
                        : r
                ));
                alert("✅ Certificate uploaded");
            } else {
                alert("❌ Upload failed: " + data.error);
            }
        } catch (err) {
            alert("❌ Network error");
        }
    };

    const filtered = rows.filter(r => r.training_category === activeCategory);

    const handleSaudiSave = async () => {
        setSaudiSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/api/licenses/nurse/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    license_number: saudiLicense?.license_number || null,
                    expiry_date: saudiLicense?.expiry_date?.split("T")[0] || null
                })
            });
            const data = await res.json();
            if (data.success) { setSaudiEditing(false); alert("Saved ✅"); }
            else alert("❌ " + data.error);
        } catch (err) {
            alert("❌ Save failed");
        } finally {
            setSaudiSaving(false);
        }
    };

    const handleSaudiUpload = async (file) => {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/api/licenses/nurse/${id}/upload`, {
                method: "POST",
                body: form
            });
            const data = await res.json();
            if (data.success) {
                setSaudiLicense(prev => ({ ...prev, certificate_file_path: data.path }));
                alert("✅ Certificate uploaded");
            } else alert("❌ " + data.error);
        } catch (err) {
            alert("❌ Network error");
        }
    };

    return (
        <Layout
            role="secretary"
            logoSrc="/logo.png"
            username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}
        >
            <div className="qual-container">

                {/* Header */}
                <div className="qual-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                        <h1>Qualification & Certification</h1>
                    </div>
                    {!isEditing ? (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                    ) : (
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>

                {/* Category tabs */}
                <div className="qual-tabs">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`qual-tab ${activeCategory === cat ? "active" : ""}`}
                            onClick={() => { setActiveCategory(cat); setIsEditing(false); }}
                        >
                            {cat}
                            <span className="tab-count">
                                {rows.filter(r => r.training_category === cat).length}
                            </span>
                        </button>
                    ))}
                    <button
                        className={`qual-tab ${activeCategory === "Saudi Council" ? "active" : ""}`}
                        onClick={() => { setActiveCategory("Saudi Council"); setIsEditing(false); }}
                    >
                        🪪 Saudi Council
                    </button>
                </div>

                {/* Table */}
                {activeCategory !== "Saudi Council" && <div className="qual-table">

                    {/* Table header */}
                    <div className="qual-row header">
                        <span>Training Name</span>
                        <span>Type</span>
                        <span>Expiry</span>
                        <span>Status</span>
                        <span>Certificate</span>
                    </div>

                    {filtered.length === 0 && (
                        <div className="qual-empty">No training programs in this category.</div>
                    )}

                    {filtered.map((item) => (
                        <div className="qual-row" key={item.training_id}>

                            {/* Name + mandatory badge */}
                            <span className="training-name">
                                {item.training_name}
                                {item.mandatory ? <span className="badge-mandatory">M</span> : null}
                            </span>

                            {/* Type */}
                            <span className="training-type">{item.training_type || "—"}</span>




                            {/* Expiry */}
                            <input
                                type="date"
                                value={item.expiry_date?.split("T")[0] || ""}
                                onChange={e => handleChange(item.training_id, "expiry_date", e.target.value)}
                                disabled={!isEditing}
                                className={isEditing ? "editing" : ""}
                            />


                            {/* Status */}
                            <select
                                value={item.status || "Pending"}
                                onChange={e => handleChange(item.training_id, "status", e.target.value)}
                                disabled={!isEditing}
                                className={`status-badge status-${(item.status || "Pending").toLowerCase().replace(" ", "-")}`}
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            {/* Certificate */}
                            <div className="cert-cell">
                                {item.certificate_file_path ? (
                                    <a
                                        href={`${BASE_URL}/${item.certificate_file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="cert-view"
                                    >
                                        View
                                    </a>
                                ) : (
                                    <span className="cert-none">—</span>
                                )}
                                <button
                                    className="cert-upload-btn"
                                    onClick={() => fileRefs.current[item.training_id]?.click()}
                                    title="Upload certificate"
                                >
                                    ↑
                                </button>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    style={{ display: "none" }}
                                    ref={el => fileRefs.current[item.training_id] = el}
                                    onChange={e => handleFileUpload(item.training_id, e.target.files[0])}
                                />
                            </div>

                        </div>
                    ))}
                </div>}

                {/* Saudi Council section */}
                {activeCategory === "Saudi Council" && (
                    <div className="saudi-card">
                        <div className="saudi-header">
                            <h3>🪪 Saudi Council Certificate</h3>
                            {!saudiEditing ? (
                                <button className="edit-btn" onClick={() => setSaudiEditing(true)}>Edit</button>
                            ) : (
                                <button className="save-btn" onClick={handleSaudiSave} disabled={saudiSaving}>
                                    {saudiSaving ? "Saving..." : "Save"}
                                </button>
                            )}
                        </div>

                        <div className="saudi-grid">
                            <div className="saudi-field">
                                <label>License Number</label>
                                <input
                                    type="text"
                                    value={saudiLicense?.license_number || ""}
                                    onChange={e => setSaudiLicense(prev => ({ ...prev, license_number: e.target.value }))}
                                    disabled={!saudiEditing}
                                    className={saudiEditing ? "editing" : ""}
                                    placeholder="e.g. SCFHS-2025-1001"
                                />
                            </div>

                            <div className="saudi-field">
                                <label>Expiry Date</label>
                                <input
                                    type="date"
                                    value={saudiLicense?.expiry_date?.split("T")[0] || ""}
                                    onChange={e => setSaudiLicense(prev => ({ ...prev, expiry_date: e.target.value }))}
                                    disabled={!saudiEditing}
                                    className={saudiEditing ? "editing" : ""}
                                />
                            </div>

                            <div className="saudi-field">
                                <label>Issuing Authority</label>
                                <input
                                    type="text"
                                    value={saudiLicense?.issuing_authority || "SCFHS"}
                                    disabled
                                />
                            </div>

                            <div className="saudi-field">
                                <label>Days Remaining</label>
                                <input
                                    type="text"
                                    value={saudiLicense?.days_remaining != null
                                        ? saudiLicense.days_remaining < 0
                                            ? `Expired ${Math.abs(saudiLicense.days_remaining)} days ago`
                                            : `${saudiLicense.days_remaining} days`
                                        : "—"}
                                    disabled
                                    style={{
                                        color: saudiLicense?.days_remaining < 0 ? "#c0392b"
                                            : saudiLicense?.days_remaining <= 30 ? "#e67e22"
                                                : "#27ae60",
                                        fontWeight: 700
                                    }}
                                />
                            </div>
                        </div>

                        <div className="saudi-cert">
                            <label>Certificate File</label>
                            <div className="cert-cell">
                                {saudiLicense?.certificate_file_path ? (
                                    <a href={`${BASE_URL}/${saudiLicense.certificate_file_path}`}
                                        target="_blank" rel="noreferrer" className="cert-view">
                                        View
                                    </a>
                                ) : (
                                    <span className="cert-none">No file uploaded</span>
                                )}
                                <button className="cert-upload-btn" onClick={() => saudiFileRef.current?.click()}>↑ Upload</button>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                                    style={{ display: "none" }} ref={saudiFileRef}
                                    onChange={e => handleSaudiUpload(e.target.files[0])} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}