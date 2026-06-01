
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { CheckCircle, Clock, AlertCircle, GraduationCap, Activity } from "lucide-react";
import "../styles/TrainingPage.css";


const getCompetencyUnitScope = (unitName) => {
    if (!unitName) return "General";
    const u = unitName.toUpperCase().trim();
    if (u === 'ER' || u.includes('EMERGENCY')) return 'Emergency Room';
    if (u === 'OR' || u.includes('OPERATING ROOM') || u.includes('DS') || u.includes('ENDOSCOPY')) return 'OR / DS / Endoscopy';
    if (u === 'MICU' || u === 'ICU' || u === 'NICU' || u === 'CCU' || u.includes('CRITICAL') || u.includes('INTENSIVE')) return 'Critical Care';
    if (u.includes('PEDIATRIC') || u.includes('PEDS')) return 'Pediatric';
    if (u.includes('MEDICAL') || u.includes('SURGICAL') || u.includes('WARD')) return 'Medical/Surgical';
    if (u.includes('PSYCHIATRY') || u.includes('PSYCH')) return 'Psychiatry';
    if (u.includes('OPD') || u.includes('OUTPATIENT')) return 'OPD';
    if (u.includes('CSSD')) return 'CSSD';
    if (u.includes('DIALYSIS')) return 'Dialysis Unit';
    return 'General';
};

export default function TrainingPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [nurse, setNurse] = useState(null);
    const [trainings, setTrainings] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [actionFilter, setActionFilter] = useState("All");
    const [searchName, setSearchName] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    useEffect(() => {
        const sessionUser = JSON.parse(sessionStorage.getItem("user"));
        if (!sessionUser?.user_id) return;
        setUser(sessionUser);

        fetch(`http://localhost:4000/api/training/user/${sessionUser.user_id}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));

        fetch(`http://localhost:4000/api/training/${sessionUser.user_id}`)
            .then(res => res.json())
            .then(data => {
                console.log("TRAINING DATA:", data);
                setTrainings(data?.rows ?? []);
            })
            .catch(err => console.error(err));
    }, []);

    const getAction = (status) => {
        if (status === "Completed") return "View";
        if (status === "Overdue") return "Start";
        if (status === "In Progress") return "Continue";
        return "Start";
    };

    const statusClass = (s) => {
        if (s === "Completed") return "tbadge complete";
        if (s === "Overdue") return "tbadge overdue";
        if (s === "In Progress") return "tbadge inprogress";
        return "tbadge pending";
    };

    const handleCategoryClick = (category) => {
        if (activeCategory === category) {
            setActiveCategory("All");
        } else {
            setActiveCategory(category);
        }
    };

    // Calculate checklist statistics
    const mandatoryTrainings = trainings.filter(t => t.training_category === 'Mandatory');
    const mandatoryTotal = mandatoryTrainings.length;
    const mandatoryCompleted = mandatoryTrainings.filter(t => t.status === 'Completed').length;

    const generalTrainings = trainings.filter(t => t.training_category === 'Competency' && (!t.unit_of_training || t.unit_of_training === 'General'));
    const generalTotal = generalTrainings.length;
    const generalCompleted = generalTrainings.filter(t => t.status === 'Completed').length;

    const nurseUnit = nurse?.unit || "";
    const targetScope = getCompetencyUnitScope(nurseUnit);
    const unitTrainings = trainings.filter(t => t.training_category === 'Competency' && t.unit_of_training && t.unit_of_training.toLowerCase().trim() === targetScope.toLowerCase().trim());
    const unitTotal = unitTrainings.length;
    const unitCompleted = unitTrainings.filter(t => t.status === 'Completed').length;

    // Calculate requirements & status statistics
    const completedCount = trainings.filter(t => t.status === 'Completed').length;
    const pendingCount = trainings.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const overdueCount = trainings.filter(t => t.status === 'Expired' || t.status === 'Overdue').length;

    const filtered = trainings.filter(t => {
        // 1. Category filter
        if (activeCategory === "Mandatory") {
            if (t.training_category !== "Mandatory") return false;
        } else if (activeCategory === "General") {
            if (t.training_category !== "Competency" || (t.unit_of_training && t.unit_of_training !== "General")) return false;
        } else if (activeCategory === "Unit") {
            if (t.training_category !== "Competency" || !t.unit_of_training || t.unit_of_training.toLowerCase().trim() !== targetScope.toLowerCase().trim()) return false;
        }

        // 2. Other filters
        return (
            (statusFilter === "All" || t.status === statusFilter) &&
            (actionFilter === "All" || getAction(t.status) === actionFilter) &&
            (searchName === "" || t.training_name?.toLowerCase().includes(searchName.toLowerCase())) &&
            (searchDate === "" || t.due_date?.includes(searchDate))
        );
    });

    const statuses = ["All", "Completed", "Pending", "Overdue", "In Progress"];
    const actions = ["All", "View", "Start", "Continue"];

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "–";

    return (
        <Layout role="nurse" logoSrc="/logo.png" username={nurse?.full_name || nurse?.name || user?.full_name || "Nurse"}>
            <div className="main">
                <button className="back-btn" onClick={() => navigate("/nurse-dashboard")}>
                    &larr; Back
                </button>
                <h2 style={{ marginTop: 0 }}>Training Checklist</h2>

                {/* KPI Cards Row */}
                <div className="cards-row" style={{ marginBottom: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                    
                    {/* Card 1: Competencies Checklist Card */}
                    <div className="glass-card blue" style={{ flex: 1, minWidth: '280px', padding: '20px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '145px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A5F', fontWeight: 700 }}>
                            <GraduationCap size={16} /> Competencies Checklist
                        </p>
                        <div className="rd-kpi-split" style={{ display: 'flex', gap: '10px', alignItems: 'stretch', width: '100%', flex: 1 }}>
                            <div 
                                className={`rd-kpi-split-col clickable-col ${activeCategory === 'Mandatory' ? 'active' : ''}`}
                                onClick={() => handleCategoryClick('Mandatory')}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}
                                title="Click to filter by Mandatory Competencies"
                            >
                                <h2 style={{ color: '#1E3A5F', fontSize: '24px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                                    {mandatoryCompleted} / {mandatoryTotal}
                                </h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '20px', lineHeight: '1.2' }}>Mandatory</div>
                            </div>
                            
                            <div className="rd-kpi-split-divider" />
                            
                            <div 
                                className={`rd-kpi-split-col clickable-col ${activeCategory === 'General' ? 'active' : ''}`}
                                onClick={() => handleCategoryClick('General')}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}
                                title="Click to filter by General Competencies"
                            >
                                <h2 style={{ color: '#1E3A5F', fontSize: '24px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                                    {generalCompleted} / {generalTotal}
                                </h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '20px', lineHeight: '1.2' }}>General</div>
                            </div>
                            
                            {nurseUnit && (
                                <>
                                    <div className="rd-kpi-split-divider" />
                                    <div 
                                        className={`rd-kpi-split-col clickable-col ${activeCategory === 'Unit' ? 'active' : ''}`}
                                        onClick={() => handleCategoryClick('Unit')}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between' }}
                                        title={`Click to filter by ${targetScope} Competencies`}
                                    >
                                        <h2 style={{ color: '#1E3A5F', fontSize: '24px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                                            {unitCompleted} / {unitTotal}
                                        </h2>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '20px', lineHeight: '1.2' }}>
                                            {targetScope} Specific
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Requirements & Status Card */}
                    <div className={`glass-card ${overdueCount > 0 ? 'red' : 'green'}`} style={{ flex: 1, minWidth: '280px', padding: '20px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '145px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                            <Activity size={16} /> Requirements & Status
                        </p>
                        <div className="rd-kpi-split" style={{ display: 'flex', gap: '10px', alignItems: 'stretch', width: '100%', flex: 1 }}>
                            <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
                                <h2 style={{ color: 'var(--accent-green)', fontSize: '24px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{completedCount}</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '20px', lineHeight: '1.2' }}>Completed</div>
                            </div>
                            
                            <div className="rd-kpi-split-divider" />
                            
                            <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
                                <h2 style={{ color: '#d97706', fontSize: '24px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{pendingCount}</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '20px', lineHeight: '1.2' }}>Pending / In Progress</div>
                            </div>
                            
                            <div className="rd-kpi-split-divider" />
                            
                            <div className="rd-kpi-split-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
                                <h2 style={{ color: overdueCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: '24px', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{overdueCount}</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginTop: '8px', minHeight: '20px', lineHeight: '1.2' }}>Expired / Overdue</div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="tr-table-box">
                    {/* Header / Filters */}
                    <div className="tr-header">
                        <div className="tr-col">
                            <span className="tr-col-title">Course / Competency Name</span>
                            <input
                                className="tr-search"
                                placeholder="Search"
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                            />
                        </div>
                        <div className="tr-col">
                            <span className="tr-col-title">Status ⇅</span>
                            <select className="tr-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                {statuses.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="tr-col">
                            <span className="tr-col-title">Due Date</span>
                            <input
                                className="tr-search"
                                placeholder="Search"
                                value={searchDate}
                                onChange={e => setSearchDate(e.target.value)}
                            />
                        </div>
                        <div className="tr-col">
                            <span className="tr-col-title">Action ⇅</span>
                            <select className="tr-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                                {actions.map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Active filter chip */}
                    {activeCategory !== "All" && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Active category filter:</span>
                            <span className="status active" style={{ fontSize: '12px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                {activeCategory === "Unit" ? `${targetScope} Specific` : activeCategory}
                                <button 
                                    onClick={() => setActiveCategory("All")}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '10px', color: 'var(--accent-green)', padding: '0 2px', display: 'inline-flex', alignSelf: 'center', fontWeight: 'bold' }}
                                >
                                    ✕
                                </button>
                            </span>
                        </div>
                    )}

                    {/* Rows */}
                    {filtered.length > 0 ? filtered.map((t, i) => (
                        <div className="tr-row" key={i}>
                            <div className="tr-cell">
                                {t.training_name}
                                {t.unit_of_training && t.unit_of_training !== 'General' && (
                                    <span style={{ fontSize: '10px', background: 'rgba(126, 87, 194, 0.08)', color: '#7e57c2', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px', fontWeight: 600 }}>
                                        {t.unit_of_training}
                                    </span>
                                )}
                            </div>
                            <div className="tr-cell">
                                <span className={statusClass(t.status)}>{t.status}</span>
                            </div>
                            <div className="tr-cell">
                                <span className="date-badge">{formatDate(t.due_date)}</span>
                            </div>
                            <div className="tr-cell">
                                <button className="action-btn">{getAction(t.status)}</button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: "40px", textAlign: "center", color: "#4a6070", fontSize: 14 }}>
                            No competency or training records found for this selection.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
