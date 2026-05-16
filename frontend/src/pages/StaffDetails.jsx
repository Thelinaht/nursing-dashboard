import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { 
    User, 
    Award, 
    BookOpen, 
    Briefcase, 
    Star, 
    FolderOpen,
    ArrowLeft 
} from "lucide-react";
import "../styles/StaffDetails.css";

export default function StaffDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [nurse, setNurse] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:4000/api/nurses/user/${id}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));
    }, [id]);

    if (!nurse) return <div className="main"><p>Loading...</p></div>;

    const navCards = [
        {
            label: "Staff Profile",
            subtitle: "View and edit personal details",
            path: `/nurse/${id}/profile`,
            icon: <User size={32} />
        },
        {
            label: "Qualification & Certification",
            subtitle: "Licenses and credentials",
            path: `/nurse/${id}/qualification`,
            icon: <Award size={32} />
        },
        {
            label: "Orientation Record",
            subtitle: "Onboarding and training history",
            path: `/nurse/${id}/orientation`,
            icon: <BookOpen size={32} />
        },
        {
            label: "Job Information",
            subtitle: "Role, unit, and shift details",
            path: `/nurse/${id}/job`,
            icon: <Briefcase size={32} />
        },
        {
            label: "Staff Evaluation Record",
            subtitle: "Performance and reviews",
            path: `/nurse/${id}/evaluation`,
            icon: <Star size={32} />
        },
        {
            label: "Miscellaneous",
            subtitle: "Other staff documents",
            path: `/nurse/${id}/misc`,
            icon: <FolderOpen size={32} />
        }
    ];

    return (
        <Layout
            role="secretary"
            logoSrc="/logo.png"
            username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}
        >
            <div className="main">
                <button className="back-btn" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ArrowLeft size={14} /> Back
                </button>

                <h1>{nurse.full_name?.replace(/["“”]/g, '')} — Staff Information</h1>

                <p className="section-header">Staff Sections</p>

                <div className="cards-grid">
                    {navCards.map((card) => (
                        <div
                            key={card.label}
                            className="detail-card"
                            onClick={() => navigate(card.path)}
                        >
                            <div className="req-icon-wrapper">
                                {card.icon}
                            </div>
                            <span className="req-label">{card.label}</span>
                            <span className="req-subtitle">{card.subtitle}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}