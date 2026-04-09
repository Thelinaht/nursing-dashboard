import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/StaffDetails.css";

export default function SatffDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [nurse, setNurse] = useState(null);


    useEffect(() => {
        fetch(`http://localhost:4000/api/nurses/${id}`)
            .then(res => res.json())
            .then(data => setNurse(data))
            .catch(err => console.error(err));
    }, [id]);

    if (!nurse) return <p>Loading...</p>;

    return (
        <Layout role="secretary" logoSrc="/logo.png" username="Secretary">

            <div className="details-container">

                <h1 className="nurse-title">
                    “{nurse.full_name}” informations
                </h1>

                <div className="cards-grid">

                    <div className="detail-card" onClick={() => navigate(`/nurse/${id}/profile`)}>
                        Staff Profile
                    </div>

                    <div className="detail-card" onClick={() => navigate(`/nurse/${id}/qualification`)}>
                        Qualification & Certification
                    </div>

                    <div className="detail-card" onClick={() => navigate(`/nurse/${id}/orientation`)}>
                        Orientation Record
                    </div>

                    <div className="detail-card" onClick={() => navigate(`/nurse/${id}/job`)}>
                        Job Information
                    </div>

                    <div className="detail-card" onClick={() => navigate(`/nurse/${id}/evaluation`)}>
                        Staff Evaluation Record
                    </div>

                    <div className="detail-card" onClick={() => navigate(`/nurse/${id}/misc`)}>
                        Miscellaneous
                    </div>

                </div>

            </div>

        </Layout>
    );
}