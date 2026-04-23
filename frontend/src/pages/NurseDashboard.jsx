import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/NurseDashboard.css";

export default function NurseDashboard() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);

    useEffect(() => {

        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.user_id) return;


        fetch(`http://localhost:4000/api/nurses/${user.user_id}`)
            .then(res => res.json())
            .then(async (nurseData) => {
                try {
                    const trainingRes = await fetch(`http://localhost:4000/api/training/${user.user_id}`);
                    const trainingData = await trainingRes.json();
                    setNurse({
                        ...nurseData,
                        trainings: trainingData?.rows?.filter(t => t.status !== 'Completed').slice(0, 4) || []
                    });
                } catch {
                    setNurse(nurseData);
                }
            })
            .catch(err => console.error(err));
    }, []);

    if (!nurse) return <div style={{ padding: 40 }}>Loading...</div>;

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse.full_name}>

            <div className="main">

                <h2>Nurse Profile</h2>

                {/* Profile Top Card */}
                <div className="profile-top glass-card">
                    <div className="profile-col">
                        <div className="profile-row">
                            <span className="profile-label">Name</span>
                            <span className="profile-val">{nurse.full_name}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">Job Title</span>
                            <span className="profile-val">{nurse.job_title}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">ID/Iqama</span>
                            <span className="profile-val">{nurse.national_id_iqama}</span>
                        </div>
                    </div>
                    <div className="profile-col">
                        <div className="profile-row">
                            <span className="profile-label">Unit</span>
                            <span className="profile-val">{nurse.unit}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">Position</span>
                            <span className="profile-val">{nurse.position_title}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">Status</span>
                            <span className="profile-val">
                                <span className={`status ${nurse.status?.toLowerCase()}`}>
                                    {nurse.status}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Cards */}
                <div className="bottom-cards">

                    {/* Left: Employment + Personal */}
                    <div className="info-card content-box">
                        <h3>Employment Information</h3>
                        <div className="info-row">
                            <span className="lbl">Start Date</span>
                            <span className="val">{nurse.start_date}</span>
                        </div>
                        <div className="info-row">
                            <span className="lbl">Years of Experience</span>
                            <span className="val">{nurse.years_of_experience}</span>
                        </div>
                        <div className="info-row">
                            <span className="lbl">Shift Type</span>
                            <span className="val">{nurse.shift_type}</span>
                        </div>
                        <div className="info-row">
                            <span className="lbl">Department</span>
                            <span className="val">{nurse.department}</span>
                        </div>

                        <h3 className="second">Personal Information</h3>
                        <div className="info-row">
                            <span className="lbl">Email</span>
                            <span className="val">{nurse.email}</span>
                        </div>
                        <div className="info-row">
                            <span className="lbl">Phone</span>
                            <span className="val">{nurse.phone}</span>
                        </div>
                        <div className="info-row">
                            <span className="lbl">Nationality</span>
                            <span className="val">{nurse.nationality}</span>
                        </div>
                        <div className="info-row">
                            <span className="lbl">Gender</span>
                            <span className="val">{nurse.gender}</span>
                        </div>
                        <div className="info-row">
                            <span className="lbl">Date of birth</span>
                            <span className="val">{nurse.date_of_birth}</span>
                        </div>
                    </div>

                    {/* Right: Training + License */}
                    <div className="bottom-right">

                        {/* Training History */}
                        <div className="info-card content-box">
                            <h3 style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "10px", marginBottom: "15px" }}>Training History</h3>
                            <div className="nurse-table-header">
                                <span>Course Name</span>
                                <span>Status</span>
                                <span>Date</span>
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                {nurse.trainings?.length > 0 ? (
                                    nurse.trainings.map((t, i) => (
                                        <div className="nurse-table-row" key={i}>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{t.training_name}</span>
                                            <span>
                                                <span className={`tbadge ${t.status?.toLowerCase().replace(' ', '')}`}>
                                                    {t.status}
                                                </span>
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                {t.due_date ? new Date(t.due_date).toLocaleDateString("en-GB") : "–"}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ fontSize: 13, color: "#4a6070", padding: "10px" }}>
                                        No training records found.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* License Information */}
                        <div className="info-card content-box">
                            <h3>License Information</h3>
                            <div className="info-row">
                                <span className="lbl">License Number</span>
                                <span className="val">{nurse.license_number}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl">Expiry Date</span>
                                <span className="val">{nurse.license_expiry}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl">Status</span>
                                <span className="val">
                                    <span className={`tbadge ${nurse.license_status?.toLowerCase()}`}>
                                        {nurse.license_status}
                                    </span>
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

        </Layout>
    );
}
