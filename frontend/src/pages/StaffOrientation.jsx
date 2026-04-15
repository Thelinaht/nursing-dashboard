import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/StaffOrientation.css";

export default function StaffOrientation() {

    const [isEditing, setIsEditing] = useState(false);

    const orientationData = [
        "Hospital General Orientation Certificate",
        "Nursing Department Orientation Certificate",
        "Nursing Competency Checklist Summary",
        "Medication Safety Certificate",
        "Omnicell Certificate",
        "Medication Administration and IV Therapy",
        "Annual Mandatory training course for fire and safety",
        "Annual Mandatory training course on infection control"
    ];

    return (
        <Layout role="secretary">
            <div className="orientation-container">

                <div className="orientation-header">
                    <h1>Orientation Record</h1>
                    <button
                        className="edit-btn"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? "Cancel" : "Edit"}
                    </button>
                </div>

                <div className="orientation-card">

                    <table className="orientation-table">
                        <thead>
                            <tr>
                                <th>Cert Name</th>
                                <th>Number</th>
                                <th>Expiration Date</th>
                                <th>Upload</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orientationData.map((item, index) => (
                                <tr key={index}>
                                    <td className="cert-name">{item}</td>

                                    <td>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            placeholder="---"
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="date"
                                            disabled={!isEditing}
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="file"
                                            disabled={!isEditing}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>

                <div className="save-container">
                    <button className="save-btn" disabled={!isEditing}>
                        Save
                    </button>
                </div>

            </div>
        </Layout>
    );
}