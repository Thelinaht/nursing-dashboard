import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/StaffQualification.css";

export default function Qualification() {
    const navigate = useNavigate();

    const { id } = useParams();

    const [data, setData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:4000/api/training/${id}`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [id]);

    const handleChange = (index, field, value) => {
        const updated = [...data];
        updated[index][field] = value;
        setData(updated);
    };

    const handleSave = async () => {
        try {
            for (let item of data) {
                await fetch("http://localhost:4000/api/training", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(item)
                });
            }

            setIsEditing(false);
            alert("Saved ");

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Layout role="secretary" logoSrc="/logo.png" username="Secretary">


            <div className="qual-container">

                <div className="qual-header">

                    <div className="header-left">

                        {/* back button*/}
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            ← Back
                        </button>

                        <h1>Qualification & Certification</h1>
                    </div>

                    {!isEditing ? (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>
                            Edit
                        </button>
                    ) : (
                        <button className="save-btn" onClick={handleSave}>
                            Save
                        </button>
                    )}

                </div>

                <div className="qual-table">

                    <div className="qual-row header">
                        <span>Cert Name</span>
                        <span>Upload</span>
                        <span>Expiry</span>
                        <span>Status</span>
                    </div>

                    {data.map((item, i) => (
                        <div className="qual-row" key={i}>

                            <span>{item.training_name}</span>

                            <input
                                type="file"
                                disabled={!isEditing}
                                onChange={(e) =>
                                    handleChange(i, "certificate_file_path", e.target.files[0]?.name)
                                }
                            />

                            <input
                                type="date"
                                value={item.expiry_date?.split("T")[0] || ""}
                                onChange={(e) =>
                                    handleChange(i, "expiry_date", e.target.value)
                                }
                                readOnly={!isEditing}
                                className={isEditing ? "editing" : ""}
                            />

                            <select
                                value={item.status}
                                onChange={(e) =>
                                    handleChange(i, "status", e.target.value)
                                }
                                disabled={!isEditing}
                            >
                                <option>Completed</option>
                                <option>Pending</option>
                                <option>Expired</option>
                                <option>Overdue</option>
                                <option>In Progress</option>
                            </select>

                        </div>
                    ))}

                </div>

            </div>

        </Layout>
    );
}