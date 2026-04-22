import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/JobInformation.css";

const BASE_URL = "http://localhost:4000";

export default function JobInformation() {
    const { id } = useParams(); // user_id
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [nurseId, setNurseId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileRefs = useRef({});

    useEffect(() => {
        fetch(`${BASE_URL}/api/job/${id}`)
            .then(res => res.json())
            .then(result => {
                if (result.rows) {
                    setData(result.rows);
                    setNurseId(result.nurseId);
                }
            })
            .catch(console.error);
    }, [id]);

    const handleNotesChange = (docTypeId, value) => {
        setData(prev => prev.map(r =>
            r.doc_type_id === docTypeId ? { ...r, notes: value } : r
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save notes for Job Description (parent_id = null, no file)
            for (const item of data) {
                if (item.notes !== undefined) {
                    await fetch(`${BASE_URL}/api/job`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nurse_id: nurseId,
                            doc_type_id: item.doc_type_id,
                            notes: item.notes || null
                        })
                    });
                }
            }
            setIsEditing(false);
            alert("Saved ✅");
        } catch (err) {
            alert("❌ Save failed: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (docTypeId, file) => {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/api/job/file/${id}/${docTypeId}`, {
                method: "POST",
                body: form
            });
            const result = await res.json();
            if (result.success) {
                setData(prev => prev.map(r =>
                    r.doc_type_id === docTypeId ? { ...r, file_path: result.path } : r
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

    // Separate parents and children
    const parents = data.filter(r => r.parent_id === null);
    const children = data.filter(r => r.parent_id !== null);

    // Job Description is the text one (last parent, no file upload)
    const jobDesc = parents.find(r => r.doc_name === "Job Description");
    const fileParents = parents.filter(r => r.doc_name !== "Job Description");

    return (
        <Layout role="secretary" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}>

            <div className="job-container">

                {/* Header */}
                <div className="job-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                        <h1>Job Information</h1>
                    </div>
                    {!isEditing ? (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                    ) : (
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>

                <div className="job-content">

                    {/* File documents */}
                    <div className="job-docs-grid">
                        {fileParents.map(parent => {
                            const subs = children.filter(c => c.parent_id === parent.doc_type_id);

                            return (
                                <div key={parent.doc_type_id} className="job-doc-card">
                                    <p className="job-doc-title">{parent.doc_name}</p>

                                    {/* Sub-items (e.g. Permanent Transfer etc.) */}
                                    {subs.length > 0 ? (
                                        <div className="job-sub-list">
                                            {subs.map(sub => (
                                                <div key={sub.doc_type_id} className="job-sub-item">
                                                    <span className="sub-name">› {sub.doc_name}</span>
                                                    <div className="cert-cell">
                                                        {sub.file_path ? (
                                                            <a
                                                                href={`${BASE_URL}/${sub.file_path}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="cert-view"
                                                            >View</a>
                                                        ) : (
                                                            <span className="cert-none">—</span>
                                                        )}
                                                        <button
                                                            className="cert-upload-btn"
                                                            onClick={() => fileRefs.current[sub.doc_type_id]?.click()}
                                                        >↑</button>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            style={{ display: "none" }}
                                                            ref={el => fileRefs.current[sub.doc_type_id] = el}
                                                            onChange={e => handleFileUpload(sub.doc_type_id, e.target.files[0])}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* No sub-items → direct upload */
                                        <div className="cert-cell">
                                            {parent.file_path ? (
                                                <a
                                                    href={`${BASE_URL}/${parent.file_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="cert-view"
                                                >View</a>
                                            ) : (
                                                <span className="cert-none">No file</span>
                                            )}
                                            <button
                                                className="cert-upload-btn"
                                                onClick={() => fileRefs.current[parent.doc_type_id]?.click()}
                                            >↑</button>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                style={{ display: "none" }}
                                                ref={el => fileRefs.current[parent.doc_type_id] = el}
                                                onChange={e => handleFileUpload(parent.doc_type_id, e.target.files[0])}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Job Description */}
                    {jobDesc && (
                        <div className="job-desc-section">
                            <p className="job-doc-title">Job Description</p>
                            <textarea
                                className={`job-desc-textarea ${isEditing ? "editing" : ""}`}
                                value={jobDesc.notes || ""}
                                onChange={e => handleNotesChange(jobDesc.doc_type_id, e.target.value)}
                                disabled={!isEditing}
                                placeholder="Enter job description..."
                                rows={5}
                            />
                        </div>
                    )}

                </div>

            </div>
        </Layout>
    );
}