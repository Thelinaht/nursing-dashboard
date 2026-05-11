import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { ClipboardList, GraduationCap } from "lucide-react";
import "../styles/NurseDashboard.css";

export default function NurseDashboard() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);

    useEffect(() => {

        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.user_id) return;


        fetch(`http://localhost:4000/api/nurses/user/${user.user_id}`)
            .then(res => res.json())
            .then(async (nurseData) => {
                try {
                    const trainingRes = await fetch(`http://localhost:4000/api/training/${user.user_id}`);
                    const trainingData = await trainingRes.json();
                    setNurse({
                        ...nurseData,
                        trainings: trainingData?.rows || []
                    });
                } catch {
                    setNurse(nurseData);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "—";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

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

                    {/* Left: Training History */}
                    <div className="bottom-col" style={{ position: 'relative' }}>

                        {/* Training History */}
                        <div className="info-card content-box" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', margin: 0 }}>
                            <h3 style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "10px", marginBottom: "15px", flexShrink: 0 }}>Training History</h3>
                            <div className="nurse-table-header" style={{ flexShrink: 0 }}>
                                <span>Course Name</span>
                                <span>Status</span>
                                <span>Date</span>
                            </div>
                            <div style={{ marginTop: '10px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
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

                    </div>

                    {/* Right: Employment, Personal, License */}
                    <div className="bottom-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="info-card content-box">
                            <h3>Employment Information</h3>
                            <div className="info-row">
                                <span className="lbl">Start Date</span>
                                <span className="val">{formatDate(nurse.start_date)}</span>
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
                                <span className="val">{formatDate(nurse.date_of_birth)}</span>
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
                                <span className="val">{formatDate(nurse.license_expiry)}</span>
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

                {/* Quick Actions */}
                <h3 style={{ marginTop: '20px', marginBottom: '15px', color: '#2f3e55', fontSize: '18px', fontWeight: '600' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="wave-card glass-card clickable-card" 
                         style={{ background: '#e1f5fe', border: '1px solid rgba(41, 182, 246, 0.3)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px', textAlign: 'center', minHeight: '160px' }}
                         onClick={() => navigate('/request')}>
                        <i style={{ background: '#0277bd', color: 'white', padding: '12px', borderRadius: '50%', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ClipboardList size={32} />
                        </i>
                        <h2 style={{ color: '#0277bd', margin: '0 0 10px 0', fontSize: '24px' }}>My Requests</h2>
                        <p style={{ color: '#0277bd', margin: 0, opacity: 0.8, fontSize: '14px' }}>Submit and track your leaves, resignations, and other requests.</p>
                    </div>

                    <div className="wave-card glass-card clickable-card" 
                         style={{ background: '#e8f5e9', border: '1px solid rgba(102, 187, 106, 0.3)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px', textAlign: 'center', minHeight: '160px' }}
                         onClick={() => navigate('/training')}>
                        <i style={{ background: '#2e7d32', color: 'white', padding: '12px', borderRadius: '50%', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GraduationCap size={32} />
                        </i>
                        <h2 style={{ color: '#2e7d32', margin: '0 0 10px 0', fontSize: '24px' }}>My Training</h2>
                        <p style={{ color: '#2e7d32', margin: 0, opacity: 0.8, fontSize: '14px' }}>Access your mandatory and recommended training programs.</p>
                    </div>
                </div>

            </div>

        </Layout>
    );
}
