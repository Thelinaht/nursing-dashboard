import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/RequestForm.css";

export default function DocumentUpdate() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [message, setMessage] = useState("");
    const [reason, setReason] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const fileInputRef = useRef();

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.nurse_id) return;
        fetch(`http://localhost:4000/api/nurses/${user.nurse_id}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));
    }, []);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => [...prev, ...files.map(f => f.name)]);
    };

    const handleSubmit = async () => {
        if (!message.trim()) { alert("Please write your request before submitting."); return; }
        try {
            const user = JSON.parse(sessionStorage.getItem("user"));
            const res = await fetch("http://localhost:4000/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nurse_id: user.nurse_id,
                    request_type: "Document Update",
                    title: reason,
                    description: message
                }),
            });
            if (res.ok) { alert("Request submitted successfully!"); navigate("/request"); }
            else { alert("Failed to submit request."); }
        } catch (err) { console.error(err); alert("Server error."); }
    };

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name}>
            <div className="leave-main">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className="leave-form-card">
                    <div className="leave-header">
                        <div className="leave-header-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </div>
                        <h2 className="leave-title">Document Update</h2>
                    </div>
                    <p className="leave-description-label">Staff Request</p>
                    <div className="leave-textarea-wrapper">
                        <textarea className="leave-textarea" placeholder="Click here to enter your request." value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>
                    <p className="leave-description-label">Reason</p>
                    <div className="leave-textarea-wrapper">
                        <textarea className="leave-textarea" placeholder="Click here to enter the reason." value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                    <div className="leave-actions">
                        <button className="leave-submit-btn" onClick={handleSubmit}>Submit</button>
                        <button className="leave-upload-btn" onClick={() => fileInputRef.current.click()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Upload Files
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} multiple onChange={handleFileUpload} />
                    </div>
                    <div className="leave-uploaded-bar">{uploadedFiles.length > 0 ? uploadedFiles.join(", ") : "Uploaded Files...."}</div>
                </div>
            </div>
        </Layout>
    );
}
