import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/StaffProfile.css";

export default function StaffProfile() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [nurse, setNurse] = useState(null);
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:4000/api/nurses/${id}`)
            .then(res => res.json())
            .then(data => {
                setNurse(data);
                setFormData(data);
            })
            .catch(err => console.error(err));
    }, [id]);

    //  convert hijri
    const convertToHijriISO = (date) => {
        if (!date) return "";

        const d = new Date(date);

        const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        const parts = formatter.formatToParts(d);

        const day = parts.find(p => p.type === "day")?.value;
        const month = parts.find(p => p.type === "month")?.value;
        const year = parts.find(p => p.type === "year")?.value;

        return `${year}-${month}-${day}`;
    };

    const handleSave = async () => {
        try {

            const updatedData = {
                ...formData,
                birth_date_hijri: convertToHijriISO(formData.birth_date_gregorian),
                contract_date_hijri: convertToHijriISO(formData.contract_date_gregorian),
            };

            console.log("Sending:", updatedData);

            await fetch(`http://localhost:4000/api/nurses/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedData)
            });

            const res = await fetch(`http://localhost:4000/api/nurses/${id}`);
            const freshData = await res.json();

            setNurse(freshData);
            setFormData(freshData);
            setIsEditing(false);

            alert("Updated successfully ");

        } catch (err) {
            console.error(err);
        }
    };

    if (!nurse) return <p>Loading...</p>;

    return (
        <Layout role="secretary" logoSrc="/logo.png" username="Secretary">

            <div className="profile-container">

                {/* Header */}
                <div className="profile-header">

                    {/* back button*/}
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>

                    <h1>Staff Profile</h1>

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

                {/* Grid */}
                <div className="profile-grid">

                    {renderInput("Full Name", "full_name")}
                    {renderInput("First Name", "first_name")}
                    {renderInput("Middle Name", "middle_name")}
                    {renderInput("Last Name", "last_name")}

                    {renderInput("National ID", "national_id_iqama")}
                    {renderInput("Gender", "gender")}
                    {renderInput("Nationality", "nationality")}

                    {/* Birth */}
                    <div>
                        <label>Birth Date Gregorian</label>
                        <input
                            type="date"
                            value={formData.birth_date_gregorian ? formData.birth_date_gregorian.split("T")[0] : ""}
                            onChange={(e) =>
                                setFormData(prev => ({
                                    ...prev,
                                    birth_date_gregorian: e.target.value
                                }))
                            }
                            disabled={!isEditing}
                            className={isEditing ? "editing" : ""}
                        />
                    </div>

                    <div>
                        <label>Birth Date Hijri</label>
                        <input
                            value={convertToHijriISO(formData.birth_date_gregorian)}
                            readOnly
                        />
                    </div>

                    {renderInput("Job Title", "job_title")}
                    {renderInput("Unit", "unit")}

                    {renderInput("Hospital ID", "hospital_id_number")}
                    {renderInput("Payroll Number", "payroll_number")}

                    {renderInput("Status", "status")}
                    {renderInput("Contract Type", "contract_type")}

                    {renderInput("Track Care Number", "track_care_number")}

                    {/* Contract */}
                    <div>
                        <label>Contract Date Gregorian</label>
                        <input
                            type="date"
                            value={formData.contract_date_gregorian ? formData.contract_date_gregorian.split("T")[0] : ""}
                            onChange={(e) =>
                                setFormData(prev => ({
                                    ...prev,
                                    contract_date_gregorian: e.target.value
                                }))
                            }
                            disabled={!isEditing}
                            className={isEditing ? "editing" : ""}
                        />
                    </div>

                    <div>
                        <label>Contract Date Hijri</label>
                        <input
                            value={convertToHijriISO(formData.contract_date_gregorian)}
                            readOnly
                        />
                    </div>

                    {renderInput("Qualification", "qualification")}
                    {renderInput("License Number", "license_number")}
                    {renderInput("Hire Date", "hire_date", "date")}

                </div>

            </div>

        </Layout>
    );

    //  input reusable
    function renderInput(label, name, type = "text") {
        return (
            <div>
                <label>{label}</label>
                <input
                    type={type}
                    value={
                        type === "date"
                            ? (formData[name] ? formData[name].split("T")[0] : "")
                            : (formData[name] || "")
                    }
                    onChange={(e) =>
                        setFormData(prev => ({
                            ...prev,
                            [name]: e.target.value
                        }))
                    }
                    disabled={!isEditing}
                    className={isEditing ? "editing" : ""}
                />
            </div>
        );
    }
}