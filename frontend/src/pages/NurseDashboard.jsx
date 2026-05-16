
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { ClipboardList, GraduationCap, CheckCircle, Clock, Activity, Award, ChevronRight } from "lucide-react";
import "../styles/NurseDashboard.css";
import "../styles/SupervisorDashboard.css"; // Reuse supervisor card styles

export default function NurseDashboard() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user?.user_id) return;

        // Fetch Nurse Details
        fetch(`http://localhost:4000/api/nurses/user/${user.user_id}`)
            .then(res => res.json())
            .then(async (nurseData) => {
                try {
                    // Fetch Trainings
                    const trainingRes = await fetch(`http://localhost:4000/api/training/${user.user_id}`);
                    const trainingData = await trainingRes.json();

                    setNurse({
                        ...nurseData,
                        trainings: trainingData?.rows || []
                    });

                    // Fetch Requests
                    const requestsRes = await fetch(`http://localhost:4000/api/requests`);
                    const requestsData = await requestsRes.json();
                    if (Array.isArray(requestsData)) {
                        const nurseRequests = requestsData.filter(r => r.nurse_id === nurseData.nurse_id);
                        setRequests(nurseRequests);
                    }
                } catch (err) {
                    console.error("Error fetching additional data:", err);
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

    const completedTrainings = nurse.trainings?.filter(t => t.status?.toLowerCase().includes('completed')).length || 0;
    const pendingRequests = requests.filter(r => r.current_status?.toLowerCase().includes('pending')).length || 0;

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse.full_name}>

            <div className="main">

                {/* KPI Cards Row */}
                <div className="cards-row" style={{ marginBottom: '32px' }}>
                    <div className="glass-card blue">
                        <p><CheckCircle size={22} /> Completed Training</p>
                        <h1>{completedTrainings}</h1>
                    </div>
                    <div className="glass-card yellow">
                        <p><Clock size={22} /> Pending Requests</p>
                        <h1>{pendingRequests}</h1>
                    </div>
                    {/* Dynamic License Status Card */}
                    <div className={`glass-card ${nurse.license_status?.toLowerCase().includes('expired') ? 'red' : 'green'}`}>
                        <p><Activity size={22} /> License Status</p>
                        <h1>{nurse.license_status || 'Active'}</h1>
                    </div>
                    <div className="glass-card purple">
                        <p><Award size={22} /> Experience</p>
                        <h1>{nurse.years_of_experience || 0} <span style={{ fontSize: '18px' }}>Years</span></h1>
                    </div>
                </div>

                <h2>Nurse Profile</h2>

                {/* Profile Top Card */}
                <div className="profile-top glass-card blue" style={{ padding: '32px', marginBottom: '40px' }}>
                    <div className="profile-col" style={{ gap: '16px' }}>
                        <div className="profile-row">
                            <span className="profile-label" style={{ fontWeight: '500' }}>Name</span>
                            <span className="profile-val" style={{ fontSize: '16px' }}>{nurse.full_name}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label" style={{ fontWeight: '500' }}>Job Title</span>
                            <span className="profile-val" style={{ fontSize: '16px' }}>{nurse.job_title}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label" style={{ fontWeight: '500' }}>ID/Iqama</span>
                            <span className="profile-val" style={{ fontSize: '16px' }}>{nurse.national_id_iqama}</span>
                        </div>
                    </div>
                    <div className="profile-col" style={{ gap: '16px' }}>
                        <div className="profile-row">
                            <span className="profile-label" style={{ fontWeight: '500' }}>Unit</span>
                            <span className="profile-val" style={{ fontSize: '16px' }}>{nurse.unit}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label" style={{ fontWeight: '500' }}>Position</span>
                            <span className="profile-val" style={{ fontSize: '16px' }}>{nurse.position_title}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label" style={{ fontWeight: '500' }}>Status</span>
                            <span className="profile-val">
                                <span className={`status ${nurse.status?.toLowerCase()}`}>
                                    {nurse.status}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '700' }}>Quick Actions</h3>
                <div className="cards-row" style={{ marginBottom: '40px' }}>
                    <div className="glass-card blue clickable-card"
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', height: '180px', position: 'relative' }}
                        onClick={() => navigate('/request')}>
                        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '22px', position: 'relative', zIndex: 2 }}>My Requests</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '280px', position: 'relative', zIndex: 2 }}>Submit and track your leaves, resignations, and other requests.</p>
                        <ChevronRight style={{ position: 'absolute', right: '20px', color: 'var(--text-muted)', zIndex: 2 }} size={24} />
                    </div>

                    <div className="glass-card blue clickable-card"
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', height: '180px', position: 'relative' }}
                        onClick={() => navigate('/training')}>
                        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '22px', position: 'relative', zIndex: 2 }}>My Training</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '280px', position: 'relative', zIndex: 2 }}>Access your mandatory and recommended training programs.</p>
                        <ChevronRight style={{ position: 'absolute', right: '20px', color: 'var(--text-muted)', zIndex: 2 }} size={24} />
                    </div>
                </div>

                {/* Bottom Cards */}
                <div className="bottom-cards">

                    {/* Left: Training History */}
                    <div className="bottom-col" style={{ position: 'relative' }}>

                        {/* Training History */}
                        <div className="info-card content-box" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', margin: 0 }}>
                            <h3 style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "10px", marginBottom: "15px", flexShrink: 0 }}>Training History</h3>
                            <div className="nurse-table-header" style={{ flexShrink: 0, padding: '16px 20px', backgroundColor: '#f1f5f9' }}>
                                <span>Course Name</span>
                                <span>Status</span>
                                <span>Date</span>
                            </div>
                            <div style={{ marginTop: '10px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                                {nurse.trainings?.length > 0 ? (
                                    nurse.trainings.map((t, i) => (
                                        <div className="nurse-table-row" key={i} style={{ padding: '16px 20px', transition: 'var(--transition-fast)' }}>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{t.training_name}</span>
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
                                    <p style={{ fontSize: 15, color: "var(--text-muted)", padding: "20px" }}>
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

            </div>

        </Layout>
    );
}

