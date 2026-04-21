import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/SecretaryDashboard.css";
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
        status: ""
    });

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
    const statuses = [...new Set(nurses.map(n => n.status).filter(Boolean))];

    //  filtering + sorting logic
    const filteredNurses = nurses.filter(n =>
        (!filters.job_title || n.job_title === filters.job_title) &&
        (!filters.position_title || n.position_title === filters.position_title) &&
        (!filters.unit || n.unit === filters.unit) &&
        (!filters.status || n.status === filters.status) &&
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
            n.job_title,
            n.position_title,
            n.unit,
            n.status
        ]);

        autoTable(doc, {
            startY: 25,
            head: [["Name", "Iqama", "Job Title", "Position", "Unit", "Status"]],
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

                <h1>Staff Directory</h1>

                {/*  Cards */}
                <div className="cards">
                    <div className="card big glass-card">
                        <p>Total Number of Nurses</p>
                        <h1>{totalNurses}</h1>
                    </div>


                    <div className="card big danger" onClick={() => navigate("/licenses")} style={{ cursor: "pointer" }}>

                        <p>Expired License</p>
                        <h1>{expiredLicenses}</h1>
                    </div>

                    <button
                        className="add-nurse-btn"
                        onClick={() => navigate("/add-nurse")}
                    >
                        + Add New Nurse Record
                    </button>
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
                    </div>

                    {/* Row 2: active chips + report btn */}
                    <div className="filter-actions">
                        <div className="active-filters">
                            <span className="results-count">{filteredNurses.length} result{filteredNurses.length !== 1 ? "s" : ""}</span>
                            {filters.job_title && <span className="filter-chip">{filters.job_title}<button onClick={() => handleFilterChange("job_title", "")}>✕</button></span>}
                            {filters.position_title && <span className="filter-chip">{filters.position_title}<button onClick={() => handleFilterChange("position_title", "")}>✕</button></span>}
                            {filters.unit && <span className="filter-chip">{filters.unit}<button onClick={() => handleFilterChange("unit", "")}>✕</button></span>}
                            {filters.status && <span className="filter-chip">{filters.status}<button onClick={() => handleFilterChange("status", "")}>✕</button></span>}
                            {(filters.job_title || filters.position_title || filters.unit || filters.status || search) && (
                                <button className="clear-btn" onClick={() => { setFilters({ job_title: "", position_title: "", unit: "", status: "" }); setSearch(""); }}>Clear all</button>
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

                    <h2 className="content-box-title">Nurses Informations</h2>

                    <div className="list-header">
                        <span>Name</span>
                        <span>Iqama</span>
                        <span>Job Title</span>
                        <span>Position</span>
                        <span>Unit</span>
                        <span>Status</span>
                    </div>

                    <div className="nurses-list">
                        {filteredNurses.map(nurse => (
                            <div
                                key={nurse.user_id}
                                className="nurse-card premium-row"
                                onClick={() => navigate(`/nurse/${nurse.user_id}`)}
                            >
                                <div>{nurse.full_name}</div>
                                <div>{nurse.national_id_iqama}</div>
                                <div>{nurse.job_title}</div>
                                <div>{nurse.position_title}</div>
                                <div>{nurse.unit}</div>

                                <span className={`status ${nurse.status?.toLowerCase().replace(" ", "-")}`}>
                                    {nurse.status}
                                </span>

                            </div>
                        ))}
                    </div>

                </div >

            </div >

        </Layout >
    );
}