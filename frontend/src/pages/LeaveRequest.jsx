import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
    Calendar,
    ChevronLeft,
    Upload,
    X,
    FileText,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react";
import "../styles/RequestForm.css";
import { uploadRequestFiles } from "../utils/uploadRequestFiles";

export default function LeaveRequest() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [leaveType, setLeaveType] = useState("planned");
    const [uploadedFiles, setUploadedFiles] = useState([]); // File objects
    const fileInputRef = useRef();

    // Planned Leave
    const [plannedType, setPlannedType] = useState("Annual Leave");
    const [plannedDays, setPlannedDays] = useState("");
    const [plannedStartDate, setPlannedStartDate] = useState("");
    const [plannedCtBefore, setPlannedCtBefore] = useState("");
    const [plannedCtAfter, setPlannedCtAfter] = useState("");
    const [plannedJoiningDate, setPlannedJoiningDate] = useState("");

    // Unplanned Leave
    const [unplannedType, setUnplannedType] = useState("Annual Leave");
    const [unplannedReason, setUnplannedReason] = useState("");
    const [unplannedDays, setUnplannedDays] = useState("");
    const [unplannedStartDate, setUnplannedStartDate] = useState("");
    const [unplannedJoiningDate, setUnplannedJoiningDate] = useState("");

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
        if (leaveType === "planned" && (!plannedType || !plannedStartDate || !plannedDays)) {
            alert("Please fill in all mandatory fields.");
            return;
        }
        if (leaveType === "unplanned" && (!unplannedType || !unplannedStartDate || !unplannedDays || !unplannedReason)) {
            alert("Please fill in all mandatory fields.");
            return;
        }

        try {
            const isPlanned = leaveType === "planned";
            const title = isPlanned
                ? `Planned Leave - ${plannedType} - ${plannedDays} days`
                : `Unplanned Leave - ${unplannedType} - ${unplannedDays} days`;

            const description = isPlanned
                ? `Starting: ${plannedStartDate}, Joining: ${plannedJoiningDate}, CT Before: ${plannedCtBefore}, CT After: ${plannedCtAfter}`
                : `Reason: ${unplannedReason}, Starting: ${unplannedStartDate}, Joining: ${unplannedJoiningDate}`;

            const res = await fetch("http://localhost:4000/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nurse_id: nurse?.nurse_id || JSON.parse(sessionStorage.getItem("user"))?.nurse_id || JSON.parse(sessionStorage.getItem("user"))?.user_id || JSON.parse(sessionStorage.getItem("user"))?.id,
                    request_type: "Leave Request",
                    title,
                    description,
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
                            <Calendar size={28} />
                        </div>
                        <h2 className="form-title-premium">Staff Leave Application</h2>
                    </div>

                    {/* Tabs */}
                    <div className="form-toggle-group">
                        <button
                            className={`toggle-item-premium ${leaveType === "planned" ? "active" : ""}`}
                            onClick={() => setLeaveType("planned")}
                        >
                            Planned Leave
                        </button>
                        <button
                            className={`toggle-item-premium ${leaveType === "unplanned" ? "active" : ""}`}
                            onClick={() => setLeaveType("unplanned")}
                        >
                            Unplanned Leave
                        </button>
                    </div>

                    {/* Form Body */}
                    <div className="form-content">
                        {leaveType === "planned" ? (
                            <div className="form-section">
                                <div className="form-group-premium">
                                    <label className="form-label-premium">Type of Leave</label>
                                    <div className="radio-pill-group">
                                        {["Annual Leave", "Comp time", "Other"].map(type => (
                                            <div key={type}>
                                                <input
                                                    type="radio"
                                                    id={`planned-${type}`}
                                                    name="plannedType"
                                                    value={type}
                                                    className="radio-pill-input"
                                                    checked={plannedType === type}
                                                    onChange={e => setPlannedType(e.target.value)}
                                                />
                                                <label htmlFor={`planned-${type}`} className="radio-pill-label">{type}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-grid-premium">
                                    <div className="form-group-premium">
                                        <label className="form-label-premium">No. of Days</label>
                                        <input className="form-input-premium" type="number" value={plannedDays} onChange={e => setPlannedDays(e.target.value)} placeholder="Enter number of days" />
                                    </div>
                                    <div className="form-group-premium">
                                        <label className="form-label-premium">Starting Date</label>
                                        <input className="form-input-premium" type="date" value={plannedStartDate} onChange={e => setPlannedStartDate(e.target.value)} />
                                    </div>

                                    {plannedType === "Comp time" && (
                                        <>
                                            <div className="form-group-premium">
                                                <label className="form-label-premium">No. of CT Before Leave</label>
                                                <input className="form-input-premium" type="number" value={plannedCtBefore} onChange={e => setPlannedCtBefore(e.target.value)} placeholder="0" />
                                            </div>
                                            <div className="form-group-premium">
                                                <label className="form-label-premium">No. of CT After Leave</label>
                                                <input className="form-input-premium" type="number" value={plannedCtAfter} onChange={e => setPlannedCtAfter(e.target.value)} placeholder="0" />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="form-group-premium">
                                    <label className="form-label-premium">Joining Date</label>
                                    <input className="form-input-premium" type="date" value={plannedJoiningDate} onChange={e => setPlannedJoiningDate(e.target.value)} />
                                </div>
                            </div>
                        ) : (
                            <div className="form-section">
                                <div className="form-group-premium">
                                    <label className="form-label-premium">Type of Leave</label>
                                    <div className="radio-pill-group">
                                        {["Annual Leave", "Comp time", "Other"].map(type => (
                                            <div key={type}>
                                                <input
                                                    type="radio"
                                                    id={`unplanned-${type}`}
                                                    name="unplannedType"
                                                    value={type}
                                                    className="radio-pill-input"
                                                    checked={unplannedType === type}
                                                    onChange={e => setUnplannedType(e.target.value)}
                                                />
                                                <label htmlFor={`unplanned-${type}`} className="radio-pill-label">{type}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group-premium">
                                    <label className="form-label-premium">Reason</label>
                                    <textarea className="form-textarea-premium" value={unplannedReason} onChange={e => setUnplannedReason(e.target.value)} placeholder="Please explain the reason for your unplanned leave..." />
                                </div>

                                <div className="form-grid-premium">
                                    <div className="form-group-premium">
                                        <label className="form-label-premium">No. of Days</label>
                                        <input className="form-input-premium" type="number" value={unplannedDays} onChange={e => setUnplannedDays(e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="form-group-premium">
                                        <label className="form-label-premium">Starting Date</label>
                                        <input className="form-input-premium" type="date" value={unplannedStartDate} onChange={e => setUnplannedStartDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group-premium">
                                    <label className="form-label-premium">Joining Date</label>
                                    <input className="form-input-premium" type="date" value={unplannedJoiningDate} onChange={e => setUnplannedJoiningDate(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* File Upload Dropzone */}
                    <div className="form-section-title">Supporting Documents</div>
                    <div className="upload-dropzone-premium" onClick={() => fileInputRef.current.click()}>
                        <div className="upload-icon-wrapper">
                            <Upload size={32} />
                        </div>
                        <div className="upload-text-main">Click to upload files</div>
                        <div className="upload-text-sub">Maximum file size: 5MB</div>
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} multiple onChange={handleFileUpload} />
                    </div>

                    {/* File Chips */}
                    <div className="file-chips-container">
                        {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="file-chip">
                                <FileText size={14} />
                                <span>{file.name}</span>
                                <X size={14} className="file-chip-remove" onClick={(e) => { e.stopPropagation(); removeFile(file); }} />
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="form-actions-premium">
                        <button className="btn-submit-premium" onClick={handleSubmit}>Submit Application</button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}