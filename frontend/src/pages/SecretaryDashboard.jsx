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

    // 🔥 search
    const [search, setSearch] = useState("");

    // 🔥 filters
    const [filters, setFilters] = useState({
        job_title: "",
        position_title: "",
        unit: "",
        status: ""
    });

    // 🔥 fetch data
    useEffect(() => {
        fetch("http://localhost:4000/api/nurses")
            .then(res => res.json())
            .then(data => setNurses(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, []);

    // 🔥 dynamic filter options
    const jobTitles = [...new Set(nurses.map(n => n.job_title).filter(Boolean))];
    const positions = [...new Set(nurses.map(n => n.position_title).filter(Boolean))];
    const units = [...new Set(nurses.map(n => n.unit).filter(Boolean))];
    const statuses = [...new Set(nurses.map(n => n.status).filter(Boolean))];

    // 🔥 filtering logic
    const filteredNurses = nurses.filter(n =>
        (!filters.job_title || n.job_title === filters.job_title) &&
        (!filters.position_title || n.position_title === filters.position_title) &&
        (!filters.unit || n.unit === filters.unit) &&
        (!filters.status || n.status === filters.status) &&
        (
            n.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            n.national_id_iqama?.includes(search)
        )
    );

    // 🔥 stats
    const totalNurses = filteredNurses.length;
    const expired = filteredNurses.filter(n => n.status === "EOC").length;

    // 🔥 filter change
    const handleFilterChange = (type, value) => {
        setFilters(prev => ({
            ...prev,
            [type]: value
        }));
    };

    // 🔥 PDF
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
        <Layout role="secretary" logoSrc="/logo.png" username="Secretary">

            <div className="main">

                <h2>Staff Directory</h2>
                {/* 🔥 Cards */}
                <div className="cards">
                    <div className="card big">
                        <p>Total Number of Nurses</p>
                        <h1>{totalNurses}</h1>
                    </div>

                    <div className="card big danger">
                        <p>Expired License</p>
                        <h1>{expired}</h1>
                    </div>

                    <button className="add-btn">
                        Add new Nurse Record +
                    </button>
                </div>

                {/* 🔥 Filters */}
                <div className="filter-grid">

                    <input
                        type="text"
                        placeholder="Search by name or iqama..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />

                    <select
                        value={filters.job_title}
                        onChange={(e) => handleFilterChange("job_title", e.target.value)}
                    >
                        <option value="">Job Title</option>
                        {jobTitles.map(j => <option key={j}>{j}</option>)}
                    </select>

                    <select
                        value={filters.position_title}
                        onChange={(e) => handleFilterChange("position_title", e.target.value)}
                    >
                        <option value="">Position</option>
                        {positions.map(p => <option key={p}>{p}</option>)}
                    </select>

                    <select
                        value={filters.unit}
                        onChange={(e) => handleFilterChange("unit", e.target.value)}
                    >
                        <option value="">Unit</option>
                        {units.map(u => <option key={u}>{u}</option>)}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                    >
                        <option value="">Status</option>
                        {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>

                    <button className="report-btn" onClick={generatePDF}>
                        Generate Report
                    </button>

                </div>

                {/* 🔥 Table */}
                <div className="table-box">

                    <h2 className="table-title">Nurses Informations</h2>

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
                                key={nurse.nurse_id}
                                className="nurse-card"
                                onClick={() => navigate(`/nurse/${nurse.nurse_id}`)}
                            >
                                <div>{nurse.full_name}</div>
                                <div>{nurse.national_id_iqama}</div>
                                <div>{nurse.job_title}</div>
                                <div>{nurse.position_title}</div>
                                <div>{nurse.unit}</div>

                                <span className={`status ${nurse.status?.toLowerCase()}`}>
                                    {nurse.status}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>

            </div>

        </Layout>
    );
}