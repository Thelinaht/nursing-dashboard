import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/StaffQualification.css";

const BASE_URL = "http://localhost:4000";

export default function StaffQualification() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [activeTab, setActiveTab] = useState("certs");

    // Certs state
    const [certTypes, setCertTypes] = useState([]);
    const [certData, setCertData] = useState({});   // keyed by certificate_type_id
    const [isEditing, setIsEditing] = useState(false);
    const [certSaving, setCertSaving] = useState(false);
    const certFileRefs = useRef({});

    // Saudi Council state
    const [saudiLicense, setSaudiLicense] = useState(null);
    const [saudiEditing, setSaudiEditing] = useState(false);
    const [saudiSaving, setSaudiSaving] = useState(false);
    const saudiFileRef = useRef();

    const formatDate = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        if (isNaN(dt)) return "";
        return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
    };

    useEffect(() => {
        fetch(`${BASE_URL}/api/licenses/nurse/${id}`)
            .then(r => r.json()).then(setSaudiLicense).catch(console.error);
    }, [id]);

    useEffect(() => {
        fetch(`${BASE_URL}/api/certificates/nurse/${id}`)
            .then(r => r.json())
            .then(data => {
                setCertTypes(data.types || []);
                const mapped = {};
                (data.certs || []).forEach(c => { mapped[c.certificate_type_id] = c; });
                setCertData(mapped);
            })
            .catch(console.error);
    }, [id]);

    const handleCertChange = (typeId, field, value) =>
        setCertData(prev => ({ ...prev, [typeId]: { ...(prev[typeId] || {}), [field]: value } }));

    // Save only certs that have actual data entered
    const handleSaveAll = async () => {
        setCertSaving(true);
        try {
            for (const type of certTypes) {
                const cert = certData[type.certificate_type_id] || {};
                // Only save if user entered something
                const hasData = cert.certificate_number || cert.expiry_date;
                if (!hasData) continue;
                await fetch(`${BASE_URL}/api/certificates/nurse/${id}/${type.certificate_type_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        certificate_number: cert.certificate_number || null,
                        expiry_date: cert.expiry_date?.split("T")[0] || null,
                        status: cert.status || "Valid"
                    })
                });
            }
            setIsEditing(false);
            alert("Saved ✅");
        } catch (err) { alert("❌ Save failed: " + err.message); }
        finally { setCertSaving(false); }
    };

    // Upload file — saves to classification_upload_path in DB
    const handleCertUpload = async (typeId, file) => {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/api/certificates/nurse/${id}/${typeId}/upload`, {
                method: "POST", body: form
            });
            const data = await res.json();
            if (data.success) {
                setCertData(prev => ({
                    ...prev,
                    [typeId]: { ...(prev[typeId] || {}), file_path: data.path }
                }));
                alert("✅ File uploaded");
            } else alert("❌ " + data.error);
        } catch { alert("❌ Network error"); }
    };

    // Saudi handlers
    const handleSaudiSave = async () => {
        setSaudiSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/api/licenses/nurse/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    license_number: saudiLicense?.license_number || null,
                    expiry_date: saudiLicense?.expiry_date?.split("T")[0] || null
                })
            });
            const data = await res.json();
            if (data.success) { setSaudiEditing(false); alert("Saved ✅"); }
            else alert("❌ " + data.error);
        } catch { alert("❌ Save failed"); }
        finally { setSaudiSaving(false); }
    };

    const handleSaudiUpload = async (file) => {
        if (!file) return;
        const form = new FormData(); form.append("file", file);
        const res = await fetch(`${BASE_URL}/api/licenses/nurse/${id}/upload`, { method: "POST", body: form });
        const data = await res.json();
        if (data.success) setSaudiLicense(p => ({ ...p, certificate_file_path: data.path }));
        else alert("❌ " + data.error);
    };

    return (
        <Layout role="secretary" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}>
            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="qual-container">

                {/* Header + Edit/Save button */}
                <div className="qual-header">
                    <h1>Qualification & Certification</h1>
                    {activeTab === "certs" && (
                        !isEditing
                            ? <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                            : <button className="save-btn" onClick={handleSaveAll} disabled={certSaving}>
                                {certSaving ? "Saving..." : "Save"}
                            </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="qual-tabs">
                    <button className={`qual-tab ${activeTab === "certs" ? "active" : ""}`}
                        onClick={() => { setActiveTab("certs"); setIsEditing(false); }}>
                        📄 Documents & Certificates
                    </button>
                    <button className={`qual-tab ${activeTab === "saudi" ? "active" : ""}`}
                        onClick={() => { setActiveTab("saudi"); setIsEditing(false); }}>
                        🪪 Saudi Council
                    </button>
                </div>

                {/* ── Certificates Table ── */}
                {activeTab === "certs" && (
                    <div className="qual-table">
                        {/* Header */}
                        <div className="sq-cert-header">
                            <span>Cert Name</span>
                            <span>Number</span>
                            <span>Expiration Date</span>
                            <span>Classification Certification Upload</span>
                        </div>

                        {certTypes.map(type => {
                            const cert = certData[type.certificate_type_id] || {};
                            return (
                                <div className="sq-cert-row" key={type.certificate_type_id}>
                                    {/* Name */}
                                    <span className="sq-cert-name">{type.certificate_name}</span>

                                    {/* Number */}
                                    <input
                                        type="text"
                                        value={cert.certificate_number || ""}
                                        disabled={!isEditing}
                                        className={isEditing ? "sq-input editing" : "sq-input"}
                                        placeholder={isEditing ? "Enter number..." : "—"}
                                        onChange={e => handleCertChange(type.certificate_type_id, "certificate_number", e.target.value)}
                                    />

                                    {/* Expiry date */}
                                    {!isEditing
                                        ? <input className="sq-input" value={formatDate(cert.expiry_date) || "—"} disabled />
                                        : <input
                                            type="date"
                                            className="sq-input editing"
                                            value={cert.expiry_date?.split("T")[0] || ""}
                                            onChange={e => handleCertChange(type.certificate_type_id, "expiry_date", e.target.value)}
                                        />
                                    }

                                    {/* Upload */}
                                    <div className="sq-upload-cell">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            style={{ display: "none" }}
                                            ref={el => certFileRefs.current[type.certificate_type_id] = el}
                                            onChange={e => handleCertUpload(type.certificate_type_id, e.target.files[0])}
                                        />
                                        <button
                                            className="sq-upload-btn"
                                            onClick={() => certFileRefs.current[type.certificate_type_id]?.click()}
                                        >
                                            ↑ Upload
                                        </button>
                                        {cert.file_path && (
                                            <a href={`${BASE_URL}/${cert.file_path}`} target="_blank"
                                                rel="noreferrer" className="sq-view-link">View</a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Saudi Council ── */}
                {activeTab === "saudi" && (
                    <div className="saudi-card">
                        <div className="saudi-header">
                            <h3>🪪 Saudi Council Certificate</h3>
                            {!saudiEditing
                                ? <button className="edit-btn" onClick={() => setSaudiEditing(true)}>Edit</button>
                                : <button className="save-btn" onClick={handleSaudiSave} disabled={saudiSaving}>
                                    {saudiSaving ? "Saving..." : "Save"}
                                </button>}
                        </div>
                        <div className="saudi-grid">
                            <div className="saudi-field">
                                <label>License Number</label>
                                <input type="text" value={saudiLicense?.license_number || ""}
                                    disabled={!saudiEditing} className={saudiEditing ? "editing" : ""}
                                    placeholder="e.g. SCFHS-2025-1001"
                                    onChange={e => setSaudiLicense(p => ({ ...p, license_number: e.target.value }))} />
                            </div>
                            <div className="saudi-field">
                                <label>Expiry Date</label>
                                {!saudiEditing
                                    ? <input value={formatDate(saudiLicense?.expiry_date)} disabled />
                                    : <input type="date" value={saudiLicense?.expiry_date?.split("T")[0] || ""}
                                        className="editing"
                                        onChange={e => setSaudiLicense(p => ({ ...p, expiry_date: e.target.value }))} />}
                            </div>
                            <div className="saudi-field">
                                <label>Issuing Authority</label>
                                <input value={saudiLicense?.issuing_authority || "SCFHS"} disabled />
                            </div>
                            <div className="saudi-field">
                                <label>Days Remaining</label>
                                <input disabled
                                    value={saudiLicense?.days_remaining != null
                                        ? saudiLicense.days_remaining < 0
                                            ? `Expired ${Math.abs(saudiLicense.days_remaining)} days ago`
                                            : `${saudiLicense.days_remaining} days`
                                        : "—"}
                                    style={{
                                        color: saudiLicense?.days_remaining < 0 ? "#c0392b"
                                            : saudiLicense?.days_remaining <= 30 ? "#e67e22" : "#27ae60",
                                        fontWeight: 700
                                    }} />
                            </div>
                        </div>
                        <div className="saudi-cert">
                            <label>Certificate File</label>
                            <div className="cert-cell">
                                {saudiLicense?.certificate_file_path
                                    ? <a href={`${BASE_URL}/${saudiLicense.certificate_file_path}`}
                                        target="_blank" rel="noreferrer" className="cert-view">View</a>
                                    : <span className="cert-none">No file uploaded</span>}
                                <button className="sq-upload-btn" onClick={() => saudiFileRef.current?.click()}>↑ Upload</button>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                                    ref={saudiFileRef} onChange={e => handleSaudiUpload(e.target.files[0])} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}