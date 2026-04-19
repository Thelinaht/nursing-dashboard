import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import "../styles/StaffProfile.css";

const BASE_URL = "http://localhost:4000";

export default function StaffProfile() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [nurse, setNurse] = useState(null);
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    // refs for each file input
    const fileRefs = {
        picture: useRef(),
        cv: useRef(),
        hospital_id: useRef(),
        national_id: useRef(),
        passport: useRef(),
    };

    useEffect(() => {
        fetch(`${BASE_URL}/api/information/${id}`)
            .then(res => res.json())
            .then(data => {
                setNurse(data);
                setFormData(data || {});
            })
            .catch(err => console.error(err));
    }, [id]);

    const convertToHijriISO = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
            day: "2-digit", month: "2-digit", year: "numeric"
        });
        const parts = formatter.formatToParts(d);
        const day = parts.find(p => p.type === "day")?.value;
        const month = parts.find(p => p.type === "month")?.value;
        const year = parts.find(p => p.type === "year")?.value;
        return `${year}-${month}-${day}`;
    };

    const handleSave = async () => {
        try {
            // Clean date fields — strip time portion before sending to MySQL
            const cleanDate = (val) => val ? val.split("T")[0] : null;

            const updatedData = {
                ...formData,
                birth_date_gregorian: cleanDate(formData.birth_date_gregorian),
                contract_date_gregorian: cleanDate(formData.contract_date_gregorian),
                hire_date: cleanDate(formData.hire_date),
                birth_date_hijri: convertToHijriISO(formData.birth_date_gregorian),
                contract_date_hijri: convertToHijriISO(formData.contract_date_gregorian),
            };

            const response = await fetch(`${BASE_URL}/api/information/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (!response.ok) {
                alert("❌ Update failed: " + (result.error || response.status));
                return;
            }

            // affectedRows=0 + changedRows=0 means record not found
            // affectedRows=1 + changedRows=0 means same value (still ok)
            if (result.affectedRows === 0 && result.changedRows === undefined) {
                alert("❌ Update failed: no record found");
                return;
            }

            const res = await fetch(`${BASE_URL}/api/information/${id}`);
            const freshData = await res.json();
            setNurse(freshData);
            setFormData(freshData || {});
            setIsEditing(false);
            alert("Updated successfully ✅");

        } catch (err) {
            console.error(err);
        }
    };

    // Upload a document file for a given docType
    const handleFileUpload = async (docType, file) => {
        if (!file) return;

        const form = new FormData();
        form.append("file", file);

        try {
            const res = await fetch(`${BASE_URL}/api/uploads/${id}/${docType}`, {
                method: "POST",
                body: form
            });
            const data = await res.json();

            if (data.success) {
                // refresh nurse data to show updated path
                const updated = await fetch(`${BASE_URL}/api/information/${id}`);
                const fresh = await updated.json();
                setNurse(fresh);
                setFormData(fresh || {});
                alert(`✅ File uploaded successfully`);
            } else {
                alert("❌ Upload failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("❌ Network error during upload");
        }
    };

    if (!nurse) return <p>Loading...</p>;

    return (
        <Layout
            role="secretary"
            logoSrc="/logo.png"
            username={JSON.parse(localStorage.getItem("user"))?.full_name || "Secretary"}
        >
            <div className="profile-container">

                <div className="profile-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h1>Staff Profile</h1>
                    {!isEditing ? (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                    ) : (
                        <button className="save-btn" onClick={handleSave}>Save</button>
                    )}
                </div>

                {/* ── Info fields ── */}
                <div className="profile-grid">

                    {renderInput("Full Name", "full_name")}
                    {renderInput("First Name", "first_name")}
                    {renderInput("Middle Name", "middle_name")}
                    {renderInput("Last Name", "last_name")}

                    {renderInput("National ID", "national_id_iqama")}
                    {renderSelect("Gender", "gender", ["Male", "Female"])}
                    {renderSelect("Nationality", "nationality", [
                        "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan",
                        "Argentinian", "Armenian", "Australian", "Austrian", "Azerbaijani",
                        "Bahraini", "Bangladeshi", "Belarusian", "Belgian", "Belizean",
                        "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Botswanan",
                        "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe",
                        "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean",
                        "Central African", "Chadian", "Chilean", "Chinese", "Colombian",
                        "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot",
                        "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "Ecuadorian",
                        "Egyptian", "Emirati", "Equatorial Guinean", "Eritrean", "Estonian",
                        "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese",
                        "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian",
                        "Guatemalan", "Guinean", "Guyanese", "Haitian", "Honduran",
                        "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi",
                        "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese",
                        "Jordanian", "Kazakhstani", "Kenyan", "Kuwaiti", "Kyrgyz", "Laotian",
                        "Latvian", "Lebanese", "Lesothan", "Liberian", "Libyan",
                        "Liechtensteiner", "Lithuanian", "Luxembourgish", "Macedonian",
                        "Malagasy", "Malawian", "Malaysian", "Maldivian", "Malian",
                        "Maltese", "Mauritanian", "Mauritian", "Mexican", "Moldovan",
                        "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Namibian",
                        "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Norwegian",
                        "Omani", "Pakistani", "Panamanian", "Paraguayan", "Peruvian",
                        "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan",
                        "Saudi", "Senegalese", "Serbian", "Sierra Leonean", "Singaporean",
                        "Slovak", "Slovenian", "Somali", "South African", "South Korean",
                        "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese",
                        "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik",
                        "Tanzanian", "Thai", "Togolese", "Trinidadian", "Tunisian", "Turkish",
                        "Turkmen", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan",
                        "Vietnamese", "Yemeni", "Zambian", "Zimbabwean"
                    ])}

                    {/* Birth dates */}
                    <div>
                        <label>Birth Date Gregorian</label>
                        <input
                            type="date"
                            value={formData.birth_date_gregorian?.split("T")[0] || ""}
                            onChange={e => setFormData(p => ({ ...p, birth_date_gregorian: e.target.value }))}
                            disabled={!isEditing}
                            className={isEditing ? "editing" : ""}
                        />
                    </div>
                    <div>
                        <label>Birth Date Hijri</label>
                        <input value={convertToHijriISO(formData.birth_date_gregorian)} readOnly />
                    </div>

                    {renderInput("Job Title", "job_title")}
                    {renderInput("Position Title", "position_title")}
                    {renderInput("Unit", "unit")}

                    {renderInput("Hospital ID Number", "hospital_id_number")}
                    {renderInput("Payroll Number", "payroll_number")}

                    {renderSelect("Status", "status", [
                        "Active", "On Leave", "Terminated", "Transferred", "EOC"
                    ])}

                    {renderSelect("Contract Type", "contract_type", [
                        "KFHU", "SOPHS", "IAUH", "Business Contract", "Government", "SOP"
                    ])}

                    {renderInput("Track Care Number", "track_care_number")}

                    {/* Contract dates */}
                    <div>
                        <label>Contract Date Gregorian</label>
                        <input
                            type="date"
                            value={formData.contract_date_gregorian?.split("T")[0] || ""}
                            onChange={e => setFormData(p => ({ ...p, contract_date_gregorian: e.target.value }))}
                            disabled={!isEditing}
                            className={isEditing ? "editing" : ""}
                        />
                    </div>
                    <div>
                        <label>Contract Date Hijri</label>
                        <input value={convertToHijriISO(formData.contract_date_gregorian)} readOnly />
                    </div>

                    {renderSelect("Qualification", "qualification", [
                        "Bachelor", "Diploma", "Master's", "Doctorate"
                    ])}
                    {renderInput("License Number", "license_number")}

                    <div>
                        <label>Hire Date</label>
                        <input
                            type="date"
                            value={formData.hire_date?.split("T")[0] || ""}
                            onChange={e => setFormData(p => ({ ...p, hire_date: e.target.value }))}
                            disabled={!isEditing}
                            className={isEditing ? "editing" : ""}
                        />
                    </div>

                    {renderInput("Mobile Number", "mobile_number")}
                    {renderInput("IAU Email", "iau_email")}

                </div>

                {/* ── Documents section ── */}
                <div className="documents-section">
                    <h2 className="documents-title">Documents</h2>
                    <div className="documents-grid">

                        {renderDocument("Picture", "picture", formData.picture_path)}
                        {renderDocument("Curriculum Vitae (CV)", "cv", formData.cv_path)}
                        {renderDocument("Hospital ID", "hospital_id", formData.hospital_id_path)}
                        {renderDocument("National ID / Iqama", "national_id", formData.national_id_path)}
                        {renderDocument("Passport", "passport", formData.passport_path)}

                    </div>
                </div>

            </div>
        </Layout>
    );

    // ── Helpers ──────────────────────────────────────────────

    function renderInput(label, name, type = "text") {
        return (
            <div>
                <label>{label}</label>
                <input
                    type={type}
                    value={formData[name] ?? ""}
                    onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))}
                    disabled={!isEditing}
                    className={isEditing ? "editing" : ""}
                />
            </div>
        );
    }

    function renderSelect(label, name, options) {
        return (
            <div>
                <label>{label}</label>
                <select
                    value={formData[name] ?? ""}
                    onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))}
                    disabled={!isEditing}
                    className={isEditing ? "editing" : ""}
                >
                    <option value="">Select {label}</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        );
    }

    function renderDocument(label, docType, filePath) {
        const inputRef = fileRefs[docType];
        const isImage = filePath && /\.(jpg|jpeg|png)$/i.test(filePath);
        const isPdf = filePath && /\.pdf$/i.test(filePath);

        return (
            <div className="doc-card">
                <p className="doc-label">{label}</p>

                {/* Preview area */}
                <div className="doc-preview">
                    {filePath && isImage && (
                        <img
                            src={`${BASE_URL}/${filePath}`}
                            alt={label}
                            className="doc-img-preview"
                        />
                    )}
                    {filePath && isPdf && (
                        <p className="doc-pdf-icon">📄 PDF</p>
                    )}
                    {!filePath && (
                        <p className="doc-empty">No file uploaded</p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="doc-actions">
                    {filePath && (
                        <a
                            href={`${BASE_URL}/${filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="doc-view-btn"
                        >
                            View
                        </a>
                    )}
                    <button
                        className="doc-upload-btn"
                        onClick={() => inputRef.current.click()}
                    >
                        {filePath ? "Update" : "Upload"}
                    </button>
                    <input
                        type="file"
                        ref={inputRef}
                        style={{ display: "none" }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => handleFileUpload(docType, e.target.files[0])}
                    />
                </div>
            </div>
        );
    }
}