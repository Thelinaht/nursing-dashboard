import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/StaffMiscellaneous.css";

const BASE_URL = "http://localhost:4000";

export default function StaffMiscellaneous() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [types, setTypes] = useState([]);
    const [files, setFiles] = useState([]);
    const [activeType, setActiveType] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();

    useEffect(() => {
        fetch(`${BASE_URL}/api/misc/${id}`)
            .then(res => res.json())
            .then(result => {
                if (result.types) {
                    setTypes(result.types);
                    setActiveType(result.types[0]?.misc_type_id || null);
                    setFiles(result.files || []);
                }
            })
            .catch(console.error);
    }, [id]);

    const activeFiles = files.filter(f => f.misc_type_id === activeType);

    const handleUpload = async (file) => {
        if (!file || !activeType) return;
        setUploading(true);
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/api/misc/file/${id}/${activeType}`, {
                method: "POST",
                body: form
            });
            const result = await res.json();
            if (result.success) {
                setFiles(prev => [{
                    doc_id: Date.now(),
                    misc_type_id: activeType,
                    file_name: result.name,
                    file_path: result.path,
                    uploaded_at: new Date().toISOString()
                }, ...prev]);
                alert("✅ File uploaded");
            } else {
                alert("❌ Upload failed: " + result.error);
            }
        } catch (err) {
            alert("❌ Network error");
        } finally {
            setUploading(false);
            fileRef.current.value = "";
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Delete this file?")) return;
        try {
            const res = await fetch(`${BASE_URL}/api/misc/file/${id}/${docId}`, {
                method: "DELETE"
            });
            const result = await res.json();
            if (result.success) {
                setFiles(prev => prev.filter(f => f.doc_id !== docId));
            } else {
                alert("❌ Delete failed");
            }
        } catch (err) {
            alert("❌ Network error");
        }
    };

    if (!types.length) return <p>Loading...</p>;

    return (
        <Layout role="secretary" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}>

            <div className="misc-container">

                {/* Header */}
                <div className="misc-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                        <h1>Miscellaneous</h1>
                    </div>
                </div>

                <div className="misc-body">

                    {/* Sidebar tabs */}
                    <div className="misc-tabs">
                        {types.map(t => (
                            <button
                                key={t.misc_type_id}
                                className={`misc-tab ${activeType === t.misc_type_id ? "active" : ""}`}
                                onClick={() => setActiveType(t.misc_type_id)}
                            >
                                {t.type_name}
                                <span className="tab-count">
                                    {files.filter(f => f.misc_type_id === t.misc_type_id).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="misc-content">

                        {/* Upload button */}
                        <div className="misc-upload-row">
                            <button
                                className="upload-btn"
                                onClick={() => fileRef.current.click()}
                                disabled={uploading}
                            >
                                {uploading ? "Uploading..." : "↑ Upload File"}
                            </button>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ display: "none" }}
                                ref={fileRef}
                                onChange={e => handleUpload(e.target.files[0])}
                            />
                        </div>

                        {/* Files list */}
                        {activeFiles.length === 0 ? (
                            <div className="misc-empty">No files uploaded yet.</div>
                        ) : (
                            <div className="misc-files">
                                {activeFiles.map(file => (
                                    <div key={file.doc_id} className="misc-file-row">
                                        <span className="file-icon">📄</span>
                                        <span className="file-name">{file.file_name}</span>
                                        <span className="file-date">
                                            {new Date(file.uploaded_at).toLocaleDateString()}
                                        </span>
                                        <a
                                            href={`${BASE_URL}/${file.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="cert-view"
                                        >
                                            View
                                        </a>
                                        <button
                                            className="delete-file-btn"
                                            onClick={() => handleDelete(file.doc_id)}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </Layout>
    );
}