import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { 
    GraduationCap, 
    ChevronLeft, 
    Upload, 
    X, 
    FileText 
} from "lucide-react";
import "../styles/RequestForm.css";

export default function TrainingRequest() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [request, setRequest] = useState("");
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
        setUploadedFiles(prev => [...prev, ...files.map(f => f.name)]);
    };

    const removeFile = (fileName) => {
        setUploadedFiles(prev => prev.filter(f => f !== fileName));
    };

    const handleSubmit = async () => {
        if (!request.trim() || !reason.trim()) {
            alert("Please fill in all fields.");
            return;
        }
        try {
            const res = await fetch("http://localhost:4000/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nurse_id: nurse?.nurse_id || JSON.parse(sessionStorage.getItem("user"))?.nurse_id || JSON.parse(sessionStorage.getItem("user"))?.user_id || JSON.parse(sessionStorage.getItem("user"))?.id,
                    request_type: "Training Request",
                    title: "Training Request",
                    description: `Course: ${request}\nReason: ${reason}`,
                }),
            });
            if (res.ok) {
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
                            <GraduationCap size={28} />
                        </div>
                        <h2 className="form-title-premium">Training Request</h2>
                    </div>

                    <div className="form-content">
                        <div className="form-group-premium">
                            <label className="form-label-premium">Training / Course Details</label>
                            <textarea 
                                className="form-textarea-premium" 
                                value={request} 
                                onChange={(e) => setRequest(e.target.value)} 
                                placeholder="Detail the training or course you wish to attend..." 
                            />
                        </div>

                        <div className="form-group-premium">
                            <label className="form-label-premium">Reason</label>
                            <textarea 
                                className="form-textarea-premium" 
                                value={reason} 
                                onChange={(e) => setReason(e.target.value)} 
                                placeholder="Explain how this training will benefit your professional development..." 
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
                        {uploadedFiles.map((fileName, idx) => (
                            <div key={idx} className="file-chip">
                                <FileText size={14} />
                                <span>{fileName}</span>
                                <X size={14} className="file-chip-remove" onClick={(e) => { e.stopPropagation(); removeFile(fileName); }} />
                            </div>
                        ))}
                    </div>

                    <div className="form-actions-premium">
                        <button className="btn-submit-premium" onClick={handleSubmit}>
                            Submit Request
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
