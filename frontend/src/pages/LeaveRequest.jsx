import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/LeaveRequest.css";

export default function LeaveRequest() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [leaveType, setLeaveType] = useState("planned");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const fileInputRef = useRef();

    // Planned Leave
    const [plannedType, setPlannedType] = useState("");
    const [plannedDays, setPlannedDays] = useState("");
    const [plannedStartDate, setPlannedStartDate] = useState("");
    const [plannedCtBefore, setPlannedCtBefore] = useState("");
    const [plannedCtAfter, setPlannedCtAfter] = useState("");
    const [plannedJoiningDate, setPlannedJoiningDate] = useState("");

    // Unplanned Leave
    const [unplannedType, setUnplannedType] = useState("");
    const [unplannedReason, setUnplannedReason] = useState("");
    const [unplannedDays, setUnplannedDays] = useState("");
    const [unplannedStartDate, setUnplannedStartDate] = useState("");
    const [unplannedJoiningDate, setUnplannedJoiningDate] = useState("");

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
                    nurse_id: nurse?.nurse_id,
                    request_type: "Leave Request",
                    title,
                    description,
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
            <div className="leave-main">
                <button className="back-btn" onClick={() => navigate("/request")}>← Back</button>

                <div className="leave-form-card">
                    <div className="leave-header">
                        <div className="leave-header-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <h2 className="leave-title">Staff Leave Application</h2>
                    </div>

                    {/* Leave Type Toggle */}
                    <div className="leave-type-toggle">
                        <button
                            className={`toggle-btn ${leaveType === "planned" ? "active" : ""}`}
                            onClick={() => setLeaveType("planned")}
                        >
                            Planned Leave
                        </button>
                        <button
                            className={`toggle-btn ${leaveType === "unplanned" ? "active" : ""}`}
                            onClick={() => setLeaveType("unplanned")}
                        >
                            Unplanned Leave
                        </button>
                    </div>

                    {/* Planned Leave */}
                    {leaveType === "planned" && (
                        <div className="leave-section">
                            <div className="form-field">
                                <label className="form-label">Type of Leave</label>
                                <div className="checkbox-group">
                                    <label><input type="radio" name="plannedType" value="Annual Leave" onChange={e => setPlannedType(e.target.value)} /> Annual Leave</label>
                                    <label><input type="radio" name="plannedType" value="Comp time" onChange={e => setPlannedType(e.target.value)} /> Comp time</label>
                                    <label><input type="radio" name="plannedType" value="Other" onChange={e => setPlannedType(e.target.value)} /> Other</label>
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label className="form-label">No. of Days</label>
                                    <input className="form-input" type="number" value={plannedDays} onChange={e => setPlannedDays(e.target.value)} placeholder="0" />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Starting Date</label>
                                    <input className="form-input" type="date" value={plannedStartDate} onChange={e => setPlannedStartDate(e.target.value)} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">No. of CT Before Leave</label>
                                    <input className="form-input" type="number" value={plannedCtBefore} onChange={e => setPlannedCtBefore(e.target.value)} placeholder="0" />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">No. of CT After Leave</label>
                                    <input className="form-input" type="number" value={plannedCtAfter} onChange={e => setPlannedCtAfter(e.target.value)} placeholder="0" />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Joining Date</label>
                                    <input className="form-input" type="date" value={plannedJoiningDate} onChange={e => setPlannedJoiningDate(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Unplanned Leave */}
                    {leaveType === "unplanned" && (
                        <div className="leave-section">
                            <div className="form-field">
                                <label className="form-label">Type of Leave</label>
                                <div className="checkbox-group">
                                    <label><input type="radio" name="unplannedType" value="Annual Leave" onChange={e => setUnplannedType(e.target.value)} /> Annual Leave</label>
                                    <label><input type="radio" name="unplannedType" value="Comp time" onChange={e => setUnplannedType(e.target.value)} /> Comp time</label>
                                    <label><input type="radio" name="unplannedType" value="Other" onChange={e => setUnplannedType(e.target.value)} /> Other</label>
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="form-label">Reason</label>
                                <textarea className="form-textarea" value={unplannedReason} onChange={e => setUnplannedReason(e.target.value)} placeholder="Reason for having unplanned leave" />
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label className="form-label">No. of Days</label>
                                    <input className="form-input" type="number" value={unplannedDays} onChange={e => setUnplannedDays(e.target.value)} placeholder="0" />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Starting Date</label>
                                    <input className="form-input" type="date" value={unplannedStartDate} onChange={e => setUnplannedStartDate(e.target.value)} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Joining Date</label>
                                    <input className="form-input" type="date" value={unplannedJoiningDate} onChange={e => setUnplannedJoiningDate(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="leave-actions">
                        <button className="leave-submit-btn" onClick={handleSubmit}>Submit</button>
                        <button className="leave-upload-btn" onClick={() => fileInputRef.current.click()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Upload Files
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} multiple onChange={handleFileUpload} />
                    </div>

                    <div className="leave-uploaded-bar">
                        {uploadedFiles.length > 0 ? uploadedFiles.join(", ") : "Uploaded Files...."}
                    </div>

                </div>
            </div>
        </Layout>
    );
}
