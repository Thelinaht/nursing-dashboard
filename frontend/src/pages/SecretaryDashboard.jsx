import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/SecretaryDashboard.css";
import { Users, AlertCircle, Flag, Globe } from "lucide-react";
import logo from "../assets/logo.png";

export default function SecretaryDashboard() {

    const navigate = useNavigate();
    const [nurses, setNurses] = useState([]);
    const [expiredLicenses, setExpiredLicenses] = useState(0);

    //  search
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("az"); // az | za

    //  filters
    const [filters, setFilters] = useState({
        job_title: "",
        position_title: "",
        unit: "",
        status: "",
        contract_type: "",
        nationality: "",
        years_of_experience: "",
        age: "",
        birthdate: ""
    });

    // ── Compute age from birth date ──
    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const dob = new Date(birthDate);
        if (isNaN(dob.getTime())) return null;
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age;
    };

    // fetch expiring licenses count
    useEffect(() => {
        fetch("http://localhost:4000/api/licenses/expiring")
            .then(res => res.json())
            .then(data => setExpiredLicenses(Array.isArray(data) ? data.length : 0))
            .catch(console.error);
    }, []);

    //  fetch data
    useEffect(() => {
        fetch("http://localhost:4000/api/nurses")
            .then(res => res.json())
            .then(data => setNurses(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, []);

    //  dynamic filter options
    const jobTitles = [...new Set(nurses.map(n => n.job_title).filter(Boolean))];
    const positions = [...new Set(nurses.map(n => n.position_title).filter(Boolean))];
    const units = [...new Set(nurses.map(n => n.unit).filter(Boolean))];
    const nationalities = [...new Set(nurses.map(n => n.nationality).filter(Boolean))].sort();
    const experienceYears = [...new Set(
        nurses
            .map(n => n.years_of_experience)
            .filter(v => v !== null && v !== undefined && v !== "")
    )].sort((a, b) => Number(a) - Number(b));
    const ages = [...new Set(
        nurses
            .map(n => calculateAge(n.birth_date_gregorian))
            .filter(a => a !== null && !isNaN(a))
    )].sort((a, b) => a - b);
    const statuses = ["Active", "Breech of contract", "Terminated", "Transferred", "EOC"];
    const contractTypes = ["KFHU", "SOPHS", "IAUH-SOPHS", "Business", "Tamheer", "Others"];

    //  filtering + sorting logic
    const filteredNurses = nurses.filter(n =>
        (!filters.job_title || n.job_title === filters.job_title) &&
        (!filters.position_title || n.position_title === filters.position_title) &&
        (!filters.unit || n.unit === filters.unit) &&
        (!filters.status || n.status === filters.status) &&
        (!filters.contract_type || n.contract_type === filters.contract_type) &&
        (!filters.nationality || n.nationality === filters.nationality) &&
        (!filters.years_of_experience || String(n.years_of_experience) === String(filters.years_of_experience)) &&
        (!filters.age || calculateAge(n.birth_date_gregorian) === Number(filters.age)) &&
        (!filters.birthdate || (n.birth_date_gregorian && n.birth_date_gregorian.split("T")[0] === filters.birthdate)) &&
        (
            n.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            n.national_id_iqama?.includes(search)
        )
    ).sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || "";
        const nameB = b.full_name?.toLowerCase() || "";
        return sortOrder === "az" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    //  stats
    const totalNurses = filteredNurses.length;
    const expired = filteredNurses.filter(n => n.status === "EOC").length;
    const saudiCount = nurses.filter(n => n.nationality === "Saudi").length;
    const nonSaudiCount = nurses.filter(n => n.nationality && n.nationality !== "Saudi").length;
    //  filter change
    const handleFilterChange = (type, value) => {
        setFilters(prev => ({
            ...prev,
            [type]: value
        }));
    };

    //  PDF
    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Nurses Report", 14, 15);

        const tableData = filteredNurses.map(n => [
            n.full_name,
            n.national_id_iqama,
            n.payroll_number || "",
            n.job_title,
            n.position_title,
            n.unit,
            n.status
        ]);

        autoTable(doc, {
            startY: 25,
            head: [["Name", "Iqama", "Payroll No.", "Job Title", "Position", "Unit", "Status"]],
            body: tableData,
        });

        doc.save("nurses_report.pdf");
    };

    return (
        //  <Layout role="secretary" logoSrc="/logo.png" username="Secretary">
        <Layout
            role="secretary"
            logoSrc="/logo.png"
            username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}
        >
            <div className="main">

                <div className="page-header">
                    <h1>Staff Directory</h1>
                    <button
                        className="add-nurse-btn"
                        onClick={() => navigate("/add-nurse")}
                    >
                        + Add New Nurse Record
                    </button>
                </div>

                {/*  Cards */}
                <div className="cards">
                    <div className="glass-card blue">
                        <p><Users size={20} /> Total Number of Nurses</p>
                        <h1>{totalNurses}</h1>
                    </div>

                    <div className="glass-card red" onClick={() => navigate("/licenses")} style={{ cursor: "pointer" }}>
                        <p><AlertCircle size={20} /> Expired License</p>
                        <h1>{expiredLicenses}</h1>
                    </div>

                    <div className="glass-card green">
                        <p><Flag size={20} /> Total Saudi Staff</p>
                        <h1>{saudiCount}</h1>
                    </div>

                    <div className="glass-card yellow">
                        <p><Globe size={20} /> Total Non-Saudi Staff</p>
                        <h1>{nonSaudiCount}</h1>
                    </div>
                </div>

                {/* Filters */}
                <div className="filter-section">

                    {/* Row 1: Search + dropdowns */}
                    <div className="filter-row">
                        <input
                            type="text"
                            placeholder="🔍  Search by name or iqama..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                        <select className="filter-select" value={filters.job_title} onChange={(e) => handleFilterChange("job_title", e.target.value)}>
                            <option value="">Job Title</option>
                            {jobTitles.map(j => <option key={j}>{j}</option>)}
                        </select>
                        <select className="filter-select" value={filters.position_title} onChange={(e) => handleFilterChange("position_title", e.target.value)}>
                            <option value="">Position</option>
                            {positions.map(p => <option key={p}>{p}</option>)}
                        </select>
                        <select className="filter-select" value={filters.unit} onChange={(e) => handleFilterChange("unit", e.target.value)}>
                            <option value="">Unit</option>
                            {units.map(u => <option key={u}>{u}</option>)}
                        </select>
                        <select className="filter-select" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                            <option value="">Status</option>
                            {statuses.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <select className="filter-select" value={filters.age} onChange={(e) => handleFilterChange("age", e.target.value)}>
                            <option value="">Age</option>
                            {ages.map(a => <option key={a} value={a}>{a} years old</option>)}
                        </select>
                        <select className="filter-select" value={filters.nationality} onChange={(e) => handleFilterChange("nationality", e.target.value)}>
                            <option value="">Nationality</option>
                            {nationalities.map(nat => <option key={nat} value={nat}>{nat}</option>)}
                        </select>
                        <select className="filter-select" value={filters.years_of_experience} onChange={(e) => handleFilterChange("years_of_experience", e.target.value)}>
                            <option value="">Experience</option>
                            {experienceYears.map(y => <option key={y} value={y}>{y} {Number(y) === 1 ? "year" : "years"}</option>)}
                        </select>
                        <select className="filter-select" value={filters.contract_type} onChange={(e) => handleFilterChange("contract_type", e.target.value)}>
                            <option value="">Contract Type</option>
                            {contractTypes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                            type="date"
                            className="filter-date"
                            value={filters.birthdate}
                            onChange={(e) => handleFilterChange("birthdate", e.target.value)}
                            title="Filter by birthdate"
                        />
                    </div>

                    {/* Row 2: active chips + report btn */}
                    <div className="filter-actions">
                        <div className="active-filters">
                            <span className="results-count">{filteredNurses.length} result{filteredNurses.length !== 1 ? "s" : ""}</span>
                            {filters.job_title && <span className="filter-chip">{filters.job_title}<button onClick={() => handleFilterChange("job_title", "")}>✕</button></span>}
                            {filters.position_title && <span className="filter-chip">{filters.position_title}<button onClick={() => handleFilterChange("position_title", "")}>✕</button></span>}
                            {filters.unit && <span className="filter-chip">{filters.unit}<button onClick={() => handleFilterChange("unit", "")}>✕</button></span>}
                            {filters.status && <span className="filter-chip">{filters.status}<button onClick={() => handleFilterChange("status", "")}>✕</button></span>}
                            {filters.contract_type && <span className="filter-chip">{filters.contract_type}<button onClick={() => handleFilterChange("contract_type", "")}>✕</button></span>}
                            {filters.nationality && <span className="filter-chip">{filters.nationality}<button onClick={() => handleFilterChange("nationality", "")}>✕</button></span>}
                            {filters.years_of_experience && <span className="filter-chip">{filters.years_of_experience} {Number(filters.years_of_experience) === 1 ? "year" : "years"}<button onClick={() => handleFilterChange("years_of_experience", "")}>✕</button></span>}
                            {filters.age && <span className="filter-chip">Age: {filters.age}<button onClick={() => handleFilterChange("age", "")}>✕</button></span>}
                            {filters.birthdate && <span className="filter-chip">Born: {new Date(filters.birthdate).toLocaleDateString("en-GB")}<button onClick={() => handleFilterChange("birthdate", "")}>✕</button></span>}
                            {(filters.job_title || filters.position_title || filters.unit || filters.status || filters.contract_type || filters.nationality || filters.years_of_experience || filters.age || filters.birthdate || search) && (
                                <button className="clear-btn" onClick={() => { setFilters({ job_title: "", position_title: "", unit: "", status: "", contract_type: "", nationality: "", years_of_experience: "", age: "", birthdate: "" }); setSearch(""); }}>Clear all</button>
                            )}
                        </div>
                        <button className="report-btn" onClick={generatePDF}>Generate Report</button>
                    </div>

                </div>

                {/*  Table */}
                <div className="table-box content-box">

                    <div className="table-header-row">
                        <h2 className="table-title">Nurses Informations</h2>
                        <select className="sort-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                            <option value="az">Sort By Name: A → Z</option>
                            <option value="za">Sort By Name: Z → A</option>
                        </select>
                    </div>


                    <div className="list-header">
                        <span>Name</span>
                        <span>ID/Iqama</span>
                        <span>Payroll No.</span>
                        <span>Job Title</span>
                        <span>Position</span>
                        <span>Unit</span>
                        <span>Status</span>
                    </div>

                    <div className="nurses-list">
                        {filteredNurses.map((nurse, index) => (
                            <div
                                key={nurse.user_id}
                                className="nurse-card premium-row"
                                onClick={() => navigate(`/nurse/${nurse.user_id}`)}
                            >
                                <div>{nurse.full_name || `Nurse ${nurse.user_id}`}</div>
                                <div>{nurse.national_id_iqama || `10${Math.floor(Math.random() * 90000000) + 10000000}`}</div>
                                <div>{nurse.payroll_number || "—"}</div>
                                <div>{nurse.job_title || ["Staff Nurse", "Head Nurse", "Clinic Nurse"][index % 3]}</div>
                                <div>{nurse.position_title || ["Specialist I", "Specialist II", "Nurse Specialist"][index % 3]}</div>
                                <div>{nurse.unit || ["Emergency", "ICU", "Dialysis", "CCU", "Pediatrics"][index % 5]}</div>
                                <span className={`status ${nurse.status?.toLowerCase().replace(" ", "-") || "active"}`}>
                                    {nurse.status || "Active"}
                                </span>

                            </div>
                        ))}
                    </div>

                </div >

            </div >

        </Layout >
    );
}