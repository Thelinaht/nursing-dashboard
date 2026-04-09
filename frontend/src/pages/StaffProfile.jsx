import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/StaffProfile.css";

export default function StaffProfile() {

    const { id } = useParams();
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

            <div className="profile-container">

                <div className="profile-header">
                    <h1>Staff Profile</h1>
                    <button className="edit-btn">Edit</button>
                </div>

                <div className="profile-grid">

                    <div>
                        <label>Full Name</label>
                        <input value={nurse.full_name || ""} readOnly />
                    </div>

                    <div>
                        <label>First Name</label>
                        <input value={nurse.first_name || ""} readOnly />
                    </div>

                    <div>
                        <label>Middle Name</label>
                        <input value={nurse.middle_name || ""} readOnly />
                    </div>

                    <div>
                        <label>Last Name</label>
                        <input value={nurse.last_name || ""} readOnly />
                    </div>

                    <div>
                        <label>National ID Number - iqama </label>
                        <input value={nurse.national_id_iqama || ""} readOnly />
                    </div>
                    <div>
                        <label>Gender </label>
                        <input value={nurse.gender || ""} readOnly />
                    </div>
                    <div>
                        <label>Nationality </label>
                        <input value={nurse.nationality || ""} readOnly />
                    </div>
                    <div>
                        <label>Birth Date gregorian </label>
                        <input value={nurse.birth_date_gregorian || ""} readOnly />
                    </div>

                    <div>
                        <label>Birth Date hijri </label>
                        <input value={nurse.birth_date_hijri || ""} readOnly />
                    </div>

                    <div>
                        <label>Job Title</label>
                        <input value={nurse.job_title || ""} readOnly />
                    </div>

                    <div>
                        <label>Unit</label>
                        <input value={nurse.unit || ""} readOnly />
                    </div>

                    <div>
                        <label>Hospital ID number</label>
                        <input value={nurse.hospital_id_number || ""} readOnly />
                    </div>

                    <div>
                        <label>Payroll Number</label>
                        <input value={nurse.payroll_number || ""} readOnly />
                    </div>

                    <div>
                        <label>Job Status</label>
                        <input value={nurse.status || ""} readOnly />
                    </div>

                    <div>
                        <label>Contract Type</label>
                        <input value={nurse.contract_type || ""} readOnly />
                    </div>

                    <div>
                        <label>Track Care number</label>
                        <input value={nurse.track_care_number || ""} readOnly />
                    </div>




                    <div>
                        <label>contract date gregorian</label>
                        <input value={nurse.contract_date_gregorian || ""} readOnly />
                    </div>

                    <div>
                        <label>contract date hijri </label>
                        <input value={nurse.contract_date_hijri || ""} readOnly />
                    </div>



                    <div>
                        <label>Qualification</label>
                        <input value={nurse.qualification || ""} readOnly />
                    </div>

                    <div>
                        <label>License Number</label>
                        <input value={nurse.license_number || ""} readOnly />
                    </div>

                    <div>
                        <label>Status</label>
                        <input value={nurse.status || ""} readOnly />
                    </div>

                    <div>
                        <label>Hire Date</label>
                        <input value={nurse.hire_date || ""} readOnly />
                    </div>

                </div>

                <button className="save-btn">Save</button>

            </div>

        </Layout>
    );
}