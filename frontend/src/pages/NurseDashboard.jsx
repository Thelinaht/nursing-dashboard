import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import SurveyBanner from "../components/SurveyBanner";
import { ClipboardList, GraduationCap, CheckCircle, Clock, Activity, Award, ChevronRight } from "lucide-react";
import "../styles/NurseDashboard.css";
import "../styles/SupervisorDashboard.css";

export default function NurseDashboard() {
    const navigate = useNavigate();
    const [nurse, setNurse] = useState(null);
    const [requests, setRequests] = useState([]);

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

                {/* ── Survey Banner ── */}
                <SurveyBanner />

                {/* KPI Cards Row */}
                <div className="cards-row" style={{ marginBottom: '32px' }}>
                    <div className="glass-card yellow">
                        <p><Clock size={22} /> Pending Requests</p>
                        <h1>{pendingRequests}</h1>
                    </div>
                    <div className={`glass-card ${nurse.license_status?.toLowerCase().includes('expired') ? 'red' : 'green'}`}>
                        <p><Activity size={22} /> License Status</p>
                        <h1>{nurse.license_status || 'Active'}</h1>
                    </div>
                    <div className="glass-card purple">
                        <p><Award size={22} /> Experience</p>
                        <h1>{nurse.years_of_experience || 0} <span style={{ fontSize: '18px' }}>Years</span></h1>
                    </div>
                </div>

                {/* Unified Profile Card */}
                <div className="glass-card blue" style={{ padding: '32px', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Nurse Profile
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', width: '100%' }}>
                        
                        {/* Basic Info */}
                        <div className="profile-col" style={{ gap: '16px' }}>
                            <h3 style={{ borderBottom: '1px solid rgba(15,23,42,0.1)', paddingBottom: '12px', marginBottom: '20px', color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>Basic Info</h3>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Name</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.full_name}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Job Title</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.job_title}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>ID/Iqama</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.national_id_iqama}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Unit</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.unit}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Status</span>
                                <span className="val">
                                    <span className={`status ${nurse.status?.toLowerCase()}`}>
                                        {nurse.status}
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Employment */}
                        <div className="profile-col" style={{ gap: '16px' }}>
                            <h3 style={{ borderBottom: '1px solid rgba(15,23,42,0.1)', paddingBottom: '12px', marginBottom: '20px', color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>Employment</h3>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Start Date</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{formatDate(nurse.start_date)}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Experience</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.years_of_experience} Years</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Shift Type</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.shift_type}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Department</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.department}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Position</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.position_title}</span>
                            </div>
                        </div>

                        {/* Personal */}
                        <div className="profile-col" style={{ gap: '16px' }}>
                            <h3 style={{ borderBottom: '1px solid rgba(15,23,42,0.1)', paddingBottom: '12px', marginBottom: '20px', color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>Personal</h3>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Email</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal', wordBreak: 'break-all' }}>{nurse.email}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Phone</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.phone}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Nationality</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.nationality}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Gender</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.gender}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Date of Birth</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{formatDate(nurse.date_of_birth)}</span>
                            </div>
                        </div>

                        {/* License */}
                        <div className="profile-col" style={{ gap: '16px' }}>
                            <h3 style={{ borderBottom: '1px solid rgba(15,23,42,0.1)', paddingBottom: '12px', marginBottom: '20px', color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>License</h3>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>License No.</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>{nurse.license_number}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Expiry Date</span>
                                <span className="val" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 'normal' }}>
                                    {(!nurse.license_expiry || formatDate(nurse.license_expiry) === '—') ? (
                                        <span 
                                            style={{ color: '#ef4444', fontWeight: 'normal', cursor: 'pointer', textDecoration: 'underline' }}
                                            onClick={() => navigate('/request')}
                                            title="Submit a document update request"
                                        >
                                            Not Set - Update
                                        </span>
                                    ) : (
                                        formatDate(nurse.license_expiry)
                                    )}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="lbl" style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>Status</span>
                                <span className="val">
                                    <span className={`tbadge ${nurse.license_status?.toLowerCase()}`}>
                                        {nurse.license_status}
                                    </span>
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Quick Actions Action Banner */}
                <div 
                    className="glass-card blue clickable-card"
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', marginBottom: '40px', position: 'relative' }}
                    onClick={() => navigate('/request')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 2 }}>
                        <div style={{ padding: '16px', background: 'rgba(30,58,95,0.1)', borderRadius: '16px' }}>
                            <ClipboardList size={32} color="var(--accent-blue)" />
                        </div>
                        <div>
                            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>My Requests</h2>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.9, fontSize: '15px' }}>Submit and track your leaves, resignations, and other requests.</p>
                        </div>
                    </div>
                    <ChevronRight style={{ color: 'var(--text-muted)', zIndex: 2 }} size={28} />
                </div>



            </div>

        </Layout>
    );
}