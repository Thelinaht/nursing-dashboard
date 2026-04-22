import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/StaffOrientation.css";

const BASE_URL = "http://localhost:4000";

export default function StaffOrientation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState([]);
    const [nurseId, setNurseId] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileRefs = useRef({});

    useEffect(() => {
        fetch(`${BASE_URL}/api/orientation/${id}`)
            .then(res => res.json())
            .then(result => {
                if (result.rows) {
                    setData(result.rows);
                    setNurseId(result.nurseId);
                }
            })
            .catch(console.error);
    }, [id]);

    const handleChange = (itemId, field, value) => {
        setData(prev => prev.map(r =>
            r.item_id === itemId ? { ...r, [field]: value } : r
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const item of data) {
                await fetch(`${BASE_URL}/api/orientation`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nurse_id: nurseId,
                        item_id: item.item_id,
                        expiry_date: item.expiry_date || null
                    })
                });
            }
            setIsEditing(false);
            alert("Saved ✅");
        } catch (err) {
            alert("❌ Save failed: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (itemId, file) => {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/api/orientation/file/${id}/${itemId}`, {
                method: "POST",
                body: form
            });
            const result = await res.json();
            if (result.success) {
                setData(prev => prev.map(r =>
                    r.item_id === itemId ? { ...r, file_path: result.path } : r
                ));
                alert("✅ File uploaded");
            } else {
                alert("❌ Upload failed: " + result.error);
            }
        } catch (err) {
            alert("❌ Network error");
        }
    };

    if (!data.length) return <p>Loading...</p>;

    return (
        <Layout role="secretary" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}>

            <div className="ori-container">

                <div className="ori-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                        <h1>Orientation Record</h1>
                    </div>
                    {!isEditing ? (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                    ) : (
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>

                <div className="ori-table">

                    <div className="ori-row header">
                        <span>Certificate Name</span>
                        <span>Expiry Date</span>
                        <span>Certificate</span>
                    </div>

                    {data.map((item) => (
                        <div className="ori-row" key={item.item_id}>

                            <span className="ori-name">{item.item_name}</span>

                            <input
                                type="date"
                                value={item.expiry_date?.split("T")[0] || ""}
                                onChange={e => handleChange(item.item_id, "expiry_date", e.target.value)}
                                disabled={!isEditing}
                                className={isEditing ? "editing" : ""}
                            />

                            <div className="cert-cell">
                                {item.file_path ? (
                                    <a
                                        href={`${BASE_URL}/${item.file_path}`}
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
                                    onClick={() => fileRefs.current[item.item_id]?.click()}
                                >↑</button>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    style={{ display: "none" }}
                                    ref={el => fileRefs.current[item.item_id] = el}
                                    onChange={e => handleFileUpload(item.item_id, e.target.files[0])}
                                />
                            </div>

                        </div>
                    ))}

                </div>

            </div>
        </Layout>
    );
}