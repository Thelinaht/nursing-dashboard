import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/StaffEvaluation.css";

const BASE_URL = "http://localhost:4000";

export default function StaffEvaluation() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileRefs = useRef({});

    useEffect(() => {
        fetch(`${BASE_URL}/api/evaluation/${id}`)
            .then(res => res.json())
            .then(result => {
                if (result.rows) setData(result.rows);
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });
    }, [id]);

    const handleFileUpload = async (evalTypeId, file) => {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/api/evaluation/file/${id}/${evalTypeId}`, {
                method: "POST",
                body: form
            });
            const result = await res.json();
            if (result.success) {
                setData(prev => prev.map(r =>
                    r.eval_type_id === evalTypeId ? { ...r, file_path: result.path } : r
                ));
                alert("✅ File uploaded");
            } else {
                alert("❌ Upload failed: " + result.error);
            }
        } catch (err) {
            alert("❌ Network error");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <Layout role="secretary" username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}>
            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="eval-container">

                {/* Header */}
                <div className="eval-header">
                    <div className="header-left">
                        <h1>Staff Evaluation Record</h1>
                    </div>
                </div>

                {/* Cards */}
                <div className="eval-grid">
                    {data.map(item => (
                        <div key={item.eval_type_id} className="eval-card">

                            <p className="eval-name">{item.eval_name}</p>

                            <div className="eval-file-area">
                                {item.file_path ? (
                                    <a
                                        href={`${BASE_URL}/${item.file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="cert-view"
                                    >
                                        View File
                                    </a>
                                ) : (
                                    <span className="cert-none">No file uploaded</span>
                                )}
                            </div>

                            <button
                                className="cert-upload-btn"
                                onClick={() => fileRefs.current[item.eval_type_id]?.click()}
                            >
                                {item.file_path ? "Replace" : "Upload"} ↑
                            </button>

                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ display: "none" }}
                                ref={el => fileRefs.current[item.eval_type_id] = el}
                                onChange={e => handleFileUpload(item.eval_type_id, e.target.files[0])}
                            />

                        </div>
                    ))}
                </div>

            </div>
        </Layout>
    );
}