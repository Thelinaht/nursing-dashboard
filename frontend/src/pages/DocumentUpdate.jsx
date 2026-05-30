import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
    FileText,
    ChevronLeft,
    Upload,
    X
} from "lucide-react";
import "../styles/RequestForm.css";
import { uploadRequestFiles } from "../utils/uploadRequestFiles";

export default function DocumentUpdate() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [message, setMessage] = useState("");
    const [reason, setReason] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const fileInputRef = useRef();

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        const targetId = user?.nurse_id || user?.user_id || user?.id;
        if (!targetId) return;
        fetch(`http://localhost:4000/api/nurses/${targetId}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));
    }, []);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (fileName) => {
        setUploadedFiles(prev => prev.filter(f => f !== fileName));
    };

    const handleSubmit = async () => {
        if (!message.trim() || !reason.trim()) {
            alert("Please fill in all fields.");
            return;
        }
        try {
            const user = JSON.parse(sessionStorage.getItem("user"));
            const res = await fetch("http://localhost:4000/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nurse_id: user?.nurse_id || user?.user_id || user?.id,
                    request_type: "Document Update",
                    title: "Document Update Request",
                    description: `Request: ${message}\nReason: ${reason}`
                }),
            });
            if (res.ok) {
                const data = await res.json();
                await uploadRequestFiles(data.insertId, uploadedFiles);
                alert("Request submitted successfully!");
                navigate("/request");
            } else {
                alert("Failed to submit request.");
            }
        } catch (err) {
            console.error(err);
            alert("Server error.");
        }
    };

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name}>
            <div className="form-main-container">
                <button className="form-back-btn" onClick={() => navigate("/request")}>
                    <ChevronLeft size={18} /> Back to Requests
                </button>

                <div className="form-card-premium">
                    <div className="form-header-premium">
                        <div className="form-icon-circle">
                            <FileText size={28} />
                        </div>
                        <h2 className="form-title-premium">Document Update Request</h2>
                    </div>

                    <div className="form-content">
                        <div className="form-group-premium">
                            <label className="form-label-premium">Staff Request</label>
                            <textarea
                                className="form-textarea-premium"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Detail the documents you need to update..."
                            />
                        </div>

                        <div className="form-group-premium">
                            <label className="form-label-premium">Reason</label>
                            <textarea
                                className="form-textarea-premium"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this update is required..."
                            />
                        </div>
                    </div>

                    <div className="form-section-title">Supporting Documents</div>
                    <div className="upload-dropzone-premium" onClick={() => fileInputRef.current.click()}>
                        <div className="upload-icon-wrapper">
                            <Upload size={32} />
                        </div>
                        <div className="upload-text-main">Click to upload files</div>
                        <div className="upload-text-sub">Maximum file size: 5MB</div>
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} multiple onChange={handleFileUpload} />
                    </div>

                    <div className="file-chips-container">
                        {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="file-chip">
                                <FileText size={14} />
                                <span>{file.name}</span>
                                <X size={14} className="file-chip-remove" onClick={(e) => { e.stopPropagation(); removeFile(file); }} />
                            </div>
                        ))}
                    </div>

                    <div className="form-actions-premium">
                        <button className="btn-submit-premium" onClick={handleSubmit}>
                            Submit Update
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}