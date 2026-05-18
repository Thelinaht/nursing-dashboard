import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/ResearcherDashboard.css";
import { BookOpen, Microscope, Presentation, Plus, Pencil, X, FileText, Eye, FileDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BASE_URL = "http://localhost:4000";

const EMPTY_PROJECT = { title: "", investigator_name: "", status: "Active", start_date: "" };
const EMPTY_PUB = { title: "", author_name: "", type: "Published", date: "", journal_name: "" };

export default function ResearcherDashboard() {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Project modal state ──
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [projectForm, setProjectForm] = useState(EMPTY_PROJECT);
    const [projectSaving, setProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState("");

    // ── Publication modal state ──
    const [showPubModal, setShowPubModal] = useState(false);
    const [editingPubId, setEditingPubId] = useState(null);
    const [pubForm, setPubForm] = useState(EMPTY_PUB);
    const [pubFile, setPubFile] = useState(null);
    const [pubExistingFile, setPubExistingFile] = useState(null);
    const [pubSaving, setPubSaving] = useState(false);
    const [pubError, setPubError] = useState("");

    // ── Report modal state ──
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportYear, setReportYear] = useState("all");

    // ── Year filter state for the tables ──
    const [projectsYearFilter, setProjectsYearFilter] = useState("all");
    const [pubsYearFilter, setPubsYearFilter] = useState("all");

    useEffect(() => {
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("user"));
            if (storedUser) setUser(storedUser);
        } catch (err) {
            console.error("Failed to parse user from session storage", err);
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projectsRes, pubsRes] = await Promise.all([
                fetch(`${BASE_URL}/api/research/projects`),
                fetch(`${BASE_URL}/api/research/publications`)
            ]);
            if (projectsRes.ok && pubsRes.ok) {
                setProjects(await projectsRes.json());
                setPublications(await pubsRes.json());
            }
        } catch (err) {
            console.error("Failed to fetch research data", err);
        } finally {
            setLoading(false);
        }
    };

    /* ============ PROJECT modal handlers ============ */
    const openAddProject = () => {
        setEditingProjectId(null);
        setProjectForm(EMPTY_PROJECT);
        setProjectError("");
        setShowProjectModal(true);
    };

    const openEditProject = (proj) => {
        setEditingProjectId(proj.project_id);
        setProjectForm({
            title: proj.title || "",
            investigator_name: proj.investigator_name || "",
            status: proj.status || "Active",
            start_date: proj.start_date ? proj.start_date.split("T")[0] : ""
        });
        setProjectError("");
        setShowProjectModal(true);
    };

    const closeProjectModal = () => { if (!projectSaving) setShowProjectModal(false); };

    const handleProjectChange = (e) => {
        const { name, value } = e.target;
        setProjectForm(prev => ({ ...prev, [name]: value }));
        setProjectError("");
    };

    const submitProject = async () => {
        if (!projectForm.title.trim()) { setProjectError("Project title is required."); return; }
        setProjectSaving(true);
        try {
            const isEdit = editingProjectId !== null;
            const url = isEdit
                ? `${BASE_URL}/api/research/projects/${editingProjectId}`
                : `${BASE_URL}/api/research/projects`;
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: projectForm.title.trim(),
                    status: projectForm.status,
                    start_date: projectForm.start_date || null,
                    investigator_name: projectForm.investigator_name.trim() || null
                })
            });
            const data = await res.json();
            if (!res.ok) { setProjectError(data.error || "Failed to save project."); return; }
            setShowProjectModal(false);
            await fetchData();
        } catch (err) {
            setProjectError("Network error. Please try again.");
        } finally {
            setProjectSaving(false);
        }
    };

    /* ============ PUBLICATION modal handlers ============ */
    const openAddPub = () => {
        setEditingPubId(null);
        setPubForm(EMPTY_PUB);
        setPubFile(null);
        setPubExistingFile(null);
        setPubError("");
        setShowPubModal(true);
    };

    const openEditPub = (pub) => {
        setEditingPubId(pub.publication_id);
        setPubForm({
            title: pub.title || "",
            author_name: pub.author_name || "",
            type: pub.type || "Published",
            date: pub.date ? pub.date.split("T")[0] : "",
            journal_name: pub.journal_name || ""
        });
        setPubFile(null);
        setPubExistingFile(pub.PublishedFile_path || null);
        setPubError("");
        setShowPubModal(true);
    };

    const closePubModal = () => { if (!pubSaving) setShowPubModal(false); };

    const handlePubChange = (e) => {
        const { name, value } = e.target;
        setPubForm(prev => ({ ...prev, [name]: value }));
        setPubError("");
    };

    const handlePubFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            setPubError("Only PDF files are allowed.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setPubError("File must be 10 MB or smaller.");
            return;
        }
        setPubFile(file);
        setPubError("");
    };

    const submitPub = async () => {
        if (!pubForm.title.trim()) { setPubError("Publication title is required."); return; }
        setPubSaving(true);
        try {
            const isEdit = editingPubId !== null;
            const url = isEdit
                ? `${BASE_URL}/api/research/publications/${editingPubId}`
                : `${BASE_URL}/api/research/publications`;

            const formData = new FormData();
            formData.append("title", pubForm.title.trim());
            formData.append("author_name", pubForm.author_name.trim());
            formData.append("type", pubForm.type);
            formData.append("date", pubForm.date || "");
            formData.append("journal_name", pubForm.journal_name.trim());
            if (pubFile) formData.append("pdf", pubFile);

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                body: formData
            });
            const data = await res.json();
            if (!res.ok) { setPubError(data.error || "Failed to save publication."); return; }
            setShowPubModal(false);
            await fetchData();
        } catch (err) {
            setPubError("Network error. Please try again.");
        } finally {
            setPubSaving(false);
        }
    };

    /* ============ Derived data ============ */
    const publishedCount = publications.filter(p => p.type === "Published").length;
    const presenterCount = publications.filter(p => p.type === "Presented").length;
    const activeProjects = projects.filter(p => p.status === "Active").length;
    const completedProjects = projects.filter(p => p.status === "Completed").length;

    const utilizationData = (() => {
        const yearMap = {};
        projects.forEach(p => {
            if (!p.start_date) return;
            const year = new Date(p.start_date).getFullYear();
            if (!yearMap[year]) yearMap[year] = { year: String(year), projects: 0, publications: 0, conferences: 0 };
            yearMap[year].projects += 1;
        });
        publications.forEach(p => {
            if (!p.date) return;
            const year = new Date(p.date).getFullYear();
            if (!yearMap[year]) yearMap[year] = { year: String(year), projects: 0, publications: 0, conferences: 0 };
            if (p.type === "Published") yearMap[year].publications += 1;
            if (p.type === "Presented") yearMap[year].conferences += 1;
        });
        return Object.values(yearMap).sort((a, b) => a.year.localeCompare(b.year));
    })();

    // All unique years that exist in either projects (start_date) or publications (date) — newest first
    const availableYears = [...new Set([
        ...projects.filter(p => p.start_date).map(p => new Date(p.start_date).getFullYear()),
        ...publications.filter(p => p.date).map(p => new Date(p.date).getFullYear())
    ])].sort((a, b) => b - a);

    // Per-table year lists
    const projectYears = [...new Set(
        projects.filter(p => p.start_date).map(p => new Date(p.start_date).getFullYear())
    )].sort((a, b) => b - a);

    const pubYears = [...new Set(
        publications.filter(p => p.date).map(p => new Date(p.date).getFullYear())
    )].sort((a, b) => b - a);

    // Filtered rows
    const visibleProjects = projects.filter(p => {
        if (projectsYearFilter === "all") return true;
        if (!p.start_date) return false;
        return new Date(p.start_date).getFullYear() === parseInt(projectsYearFilter, 10);
    });

    const visiblePublications = publications.filter(p => {
        if (pubsYearFilter === "all") return true;
        if (!p.date) return false;
        return new Date(p.date).getFullYear() === parseInt(pubsYearFilter, 10);
    });

    const generateReport = () => {
        const yearFilter = reportYear === "all" ? null : parseInt(reportYear, 10);

        const filteredProjects = projects.filter(p => {
            if (!yearFilter) return true;
            if (!p.start_date) return false;
            return new Date(p.start_date).getFullYear() === yearFilter;
        });
        const filteredPubs = publications.filter(p => {
            if (!yearFilter) return true;
            if (!p.date) return false;
            return new Date(p.date).getFullYear() === yearFilter;
        });

        const activeProjs = filteredProjects.filter(p => p.status === "Active");
        const completedProjs = filteredProjects.filter(p => p.status === "Completed");

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        let y = 20;

        // ── Report Header ──
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59); // --text-primary
        doc.text("Research Report", pageWidth / 2, y, { align: "center" });
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139); // --text-muted
        const filterText = yearFilter ? `Year: ${yearFilter}` : "All Years";
        doc.text(`${filterText}  |  Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth / 2, y, { align: "center" });
        y += 8;

        // ── Helper: build a section with a table ──
        const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";

        const addSectionTable = (label, head, rows) => {
            // Section title
            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(`${label} (${rows.length})`, margin, y);
            y += 5;

            if (rows.length === 0) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "italic");
                doc.setTextColor(150);
                doc.text("No entries.", margin + 2, y + 4);
                y += 12;
                return;
            }

            autoTable(doc, {
                startY: y,
                head: [head],
                body: rows,
                margin: { left: margin, right: margin },
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                    textColor: [71, 85, 105],   // --text-secondary
                    lineColor: [203, 213, 225],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [51, 65, 85],     // --accent-blue
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
                didDrawPage: (data) => {
                    // keep track of where the table ended
                    y = data.cursor.y + 8;
                }
            });
            y = doc.lastAutoTable.finalY + 10;
        };

        // ── Section: Research Projects (Active) ──
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Research Projects", margin, y);
        y += 8;

        const projectColumns = ["#", "Title", "Investigator", "Start Date", "Status"];
        const buildProjectRows = (list) => list.map((p, i) => [
            String(i + 1),
            p.title || "—",
            p.investigator_name || "—",
            formatDate(p.start_date),
            p.status || "—"
        ]);

        addSectionTable("Active", projectColumns, buildProjectRows(activeProjs));
        addSectionTable("Completed", projectColumns, buildProjectRows(completedProjs));

        // ── Section: Publications ──
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Publications", margin, y);
        y += 8;

        const pubColumns = ["#", "Title", "Author", "Type", "Date", "Journal / Conference", "File"];
        const pubRows = filteredPubs.map((p, i) => [
            String(i + 1),
            p.title || "—",
            p.author_name || "—",
            p.type || "—",
            formatDate(p.date),
            p.journal_name || "—",
            p.PublishedFile_path ? "View PDF" : "—"
        ]);

        // Publications table needs custom styling for the File column (blue + clickable)
        if (pubRows.length === 0) {
            // Render the empty state via the helper as usual
            addSectionTable("All Publications", pubColumns, pubRows);
        } else {
            // Section title
            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(`All Publications (${pubRows.length})`, margin, y);
            y += 5;

            autoTable(doc, {
                startY: y,
                head: [pubColumns],
                body: pubRows,
                margin: { left: margin, right: margin },
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                    textColor: [71, 85, 105],
                    lineColor: [203, 213, 225],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [51, 65, 85],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    6: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'center' }
                },
                didDrawCell: (data) => {
                    // Add clickable link annotation over the "View PDF" cells
                    if (data.section === 'body' && data.column.index === 6) {
                        const pub = filteredPubs[data.row.index];
                        if (pub && pub.PublishedFile_path) {
                            const url = `${BASE_URL}/uploads/${pub.PublishedFile_path}`;
                            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
                        }
                    }
                }
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        // ── Footer: page numbers ──
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
        }

        const suffix = yearFilter || "all-years";
        doc.save(`research-report-${suffix}-${Date.now()}.pdf`);
        setShowReportModal(false);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Active": return "rd-badge-green";
            case "Completed": return "rd-badge-amber";
            default: return "rd-badge-red";
        }
    };

    return (
        <Layout role="researchDirector" username={user?.full_name || JSON.parse(sessionStorage.getItem("user"))?.full_name || "Research User"}>
            <div className="rd-container">

                <div className="rd-header">
                    <div>
                        <h1>Research Dashboard</h1>
                        <p>Research Director · Overview &amp; EBP Metrics</p>
                    </div>
                </div>

                {loading ? (
                    <p>Loading research data...</p>
                ) : (
                    <>
                        {/* ── KPI Cards ── */}
                        <div className="rd-kpi-grid">
                            <div className="glass-card purple">
                                <p><Microscope size={22} />Research Projects</p>
                                <div className="rd-kpi-split">
                                    <div className="rd-kpi-split-col">
                                        <h1>{activeProjects}</h1>
                                        <div className="rd-kpi-split-label">Active</div>
                                    </div>
                                    <div className="rd-kpi-split-divider" />
                                    <div className="rd-kpi-split-col">
                                        <h1>{completedProjects}</h1>
                                        <div className="rd-kpi-split-label">Completed</div>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card blue">
                                <p><BookOpen size={22} /> Publications</p>
                                <h1>{publishedCount}</h1>
                            </div>
                            <div className="glass-card yellow">
                                <p><Presentation size={22} /> Conference Presentations</p>
                                <h1>{presenterCount}</h1>
                            </div>
                        </div>

                        {/* ── Chart ── */}
                        <div className="rd-card">
                            <div className="rd-card-header">
                                <p className="rd-card-title">Research Projects vs. Publications by Year</p>
                                <button onClick={() => { setReportYear("all"); setShowReportModal(true); }} className="rd-primary-btn">
                                    <FileDown size={16} /> Generate Report
                                </button>
                            </div>
                            <p className="rd-chart-subtitle">
                                Comparing the total number of research projects started (Active + Completed), publications produced, and conference presentations each year.
                            </p>
                            <div className="rd-legend-row">
                                <span className="rd-legend-item">
                                    <span className="rd-legend-dot" style={{ background: "#5a6f87" }} />
                                    Research Projects
                                </span>
                                <span className="rd-legend-item">
                                    <span className="rd-legend-dot" style={{ background: "#9fb3cc" }} />
                                    Publications
                                </span>
                                <span className="rd-legend-item">
                                    <span className="rd-legend-dot" style={{ background: "#2f3e55" }} />
                                    Conference
                                </span>
                            </div>
                            <div className="rd-chart-box">
                                {utilizationData.length === 0 ? (
                                    <div className="rd-chart-empty">
                                        No data to display yet. Add research projects or publications to see the chart.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} allowDecimals={false} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(90,111,135,0.05)' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', background: '#2f3e55', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                                labelStyle={{ color: 'white' }}
                                                itemStyle={{ color: 'rgba(255,255,255,0.85)' }}
                                            />
                                            <Bar dataKey="projects" fill="#5a6f87" radius={[4, 4, 0, 0]} barSize={22} name="Research Projects" />
                                            <Bar dataKey="publications" fill="#9fb3cc" radius={[4, 4, 0, 0]} barSize={22} name="Publications" />
                                            <Bar dataKey="conferences" fill="#2f3e55" radius={[4, 4, 0, 0]} barSize={22} name="Conference" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* ── Research Projects Table ── */}
                        <div className="rd-card">
                            <div className="rd-card-header">
                                <p className="rd-card-title">Research Projects</p>
                                <button onClick={openAddProject} className="rd-primary-btn">
                                    <Plus size={16} /> Add Project
                                </button>
                            </div>
                            <div className="rd-table-scroll">
                                <table className="rd-table">
                                    <thead>
                                        <tr className="rd-thead-row">
                                            <th className="rd-th-sticky">Project Title</th>
                                            <th className="rd-th-sticky">Principal Investigator</th>
                                            <th className="rd-th-sticky">
                                                <div className="rd-th-filter">
                                                    <span>Start Date</span>
                                                    <select
                                                        value={projectsYearFilter}
                                                        onChange={(e) => setProjectsYearFilter(e.target.value)}
                                                        className="rd-col-filter"
                                                        title="Filter by start year"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="all">All</option>
                                                        {projectYears.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                            </th>
                                            <th className="rd-th-sticky">Status</th>
                                            <th className="rd-th-sticky rd-th-sticky--narrow">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleProjects.length === 0 ? (
                                            <tr><td colSpan={5} className="rd-empty-td">
                                                {projects.length === 0
                                                    ? `No research projects yet. Click "Add Project" to get started.`
                                                    : `No projects in ${projectsYearFilter}. Try a different year.`}
                                            </td></tr>
                                        ) : visibleProjects.map((proj) => (
                                            <tr key={proj.project_id} className="rd-tr">
                                                <td className="rd-td rd-td--title">{proj.title}</td>
                                                <td className="rd-td">{proj.investigator_name || "—"}</td>
                                                <td className="rd-td">{proj.start_date ? new Date(proj.start_date).toLocaleDateString("en-GB") : "—"}</td>
                                                <td className="rd-td"><span className={`rd-badge ${getStatusBadge(proj.status)}`}>{proj.status}</span></td>
                                                <td className="rd-td">
                                                    <button onClick={() => openEditProject(proj)} title="Edit" className="rd-icon-btn">
                                                        <Pencil size={13} /> Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Publications Table ── */}
                        <div className="rd-card">
                            <div className="rd-card-header">
                                <p className="rd-card-title">Department Publications &amp; Presentations</p>
                                <button onClick={openAddPub} className="rd-primary-btn">
                                    <Plus size={16} /> Add Publication
                                </button>
                            </div>
                            <div className="rd-table-scroll">
                                <table className="rd-table">
                                    <thead>
                                        <tr className="rd-thead-row">
                                            <th className="rd-th-sticky">Title</th>
                                            <th className="rd-th-sticky">Author</th>
                                            <th className="rd-th-sticky">Type</th>
                                            <th className="rd-th-sticky">
                                                <div className="rd-th-filter">
                                                    <span>Date</span>
                                                    <select
                                                        value={pubsYearFilter}
                                                        onChange={(e) => setPubsYearFilter(e.target.value)}
                                                        className="rd-col-filter"
                                                        title="Filter by publication year"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="all">All</option>
                                                        {pubYears.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                            </th>
                                            <th className="rd-th-sticky">Journal / Conference</th>
                                            <th className="rd-th-sticky">File</th>
                                            <th className="rd-th-sticky rd-th-sticky--narrow">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visiblePublications.length === 0 ? (
                                            <tr><td colSpan={7} className="rd-empty-td">
                                                {publications.length === 0
                                                    ? `No publications yet. Click "Add Publication" to get started.`
                                                    : `No publications in ${pubsYearFilter}. Try a different year.`}
                                            </td></tr>
                                        ) : visiblePublications.map((pub) => (
                                            <tr key={pub.publication_id} className="rd-tr">
                                                <td className="rd-td rd-td--title">{pub.title}</td>
                                                <td className="rd-td">{pub.author_name || "—"}</td>
                                                <td className="rd-td">
                                                    <span className="rd-type-badge">{pub.type || "—"}</span>
                                                </td>
                                                <td className="rd-td">{pub.date ? new Date(pub.date).toLocaleDateString("en-GB") : "—"}</td>
                                                <td className="rd-td">{pub.journal_name || "—"}</td>
                                                <td className="rd-td">
                                                    {pub.PublishedFile_path ? (
                                                        <a
                                                            href={`${BASE_URL}/uploads/${pub.PublishedFile_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rd-view-link"
                                                        >
                                                            <Eye size={13} /> View PDF
                                                        </a>
                                                    ) : <span className="rd-dash">—</span>}
                                                </td>
                                                <td className="rd-td">
                                                    <button onClick={() => openEditPub(pub)} title="Edit" className="rd-icon-btn">
                                                        <Pencil size={13} /> Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ===================== PROJECT MODAL ===================== */}
            {showProjectModal && (
                <div onClick={closeProjectModal} className="rd-overlay">
                    <div onClick={(e) => e.stopPropagation()} className="rd-modal-box">
                        <div className="rd-modal-header">
                            <h2 className="rd-modal-title">{editingProjectId ? "Edit Research Project" : "Add New Research Project"}</h2>
                            <button onClick={closeProjectModal} className="rd-close-btn"><X size={22} /></button>
                        </div>

                        <div className="rd-fields-col">
                            <div>
                                <label className="rd-label">Project Title <span className="rd-req">*</span></label>
                                <input name="title" value={projectForm.title} onChange={handleProjectChange} placeholder="Enter project title..." className="rd-input" />
                            </div>
                            <div>
                                <label className="rd-label">Principal Investigator</label>
                                <input name="investigator_name" value={projectForm.investigator_name} onChange={handleProjectChange} placeholder="Investigator name..." className="rd-input" />
                            </div>
                            <div>
                                <label className="rd-label">Status <span className="rd-req">*</span></label>
                                <select name="status" value={projectForm.status} onChange={handleProjectChange} className="rd-input">
                                    <option value="Active">Active</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="rd-label">Start Date</label>
                                <input type="date" name="start_date" value={projectForm.start_date} onChange={handleProjectChange} className="rd-input" />
                            </div>

                            {projectError && <p className="rd-error">{projectError}</p>}

                            <div className="rd-actions-row">
                                <button onClick={closeProjectModal} disabled={projectSaving} className="rd-cancel-btn">Cancel</button>
                                <button onClick={submitProject} disabled={projectSaving} className="rd-save-btn">
                                    {projectSaving ? "Saving..." : (editingProjectId ? "Save Changes" : "Save Project")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== PUBLICATION MODAL ===================== */}
            {showPubModal && (
                <div onClick={closePubModal} className="rd-overlay">
                    <div onClick={(e) => e.stopPropagation()} className="rd-modal-box rd-modal-box--wide">
                        <div className="rd-modal-header">
                            <h2 className="rd-modal-title">{editingPubId ? "Edit Publication" : "Add New Publication"}</h2>
                            <button onClick={closePubModal} className="rd-close-btn"><X size={22} /></button>
                        </div>

                        <div className="rd-fields-col">
                            <div>
                                <label className="rd-label">Title <span className="rd-req">*</span></label>
                                <input name="title" value={pubForm.title} onChange={handlePubChange} placeholder="Publication title..." className="rd-input" />
                            </div>
                            <div>
                                <label className="rd-label">Author</label>
                                <input name="author_name" value={pubForm.author_name} onChange={handlePubChange} placeholder="Author name..." className="rd-input" />
                            </div>
                            <div className="rd-form-row">
                                <div>
                                    <label className="rd-label">Type</label>
                                    <select name="type" value={pubForm.type} onChange={handlePubChange} className="rd-input">
                                        <option value="Published">Published</option>
                                        <option value="Presented">Presented</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="rd-label">Date</label>
                                    <input type="date" name="date" value={pubForm.date} onChange={handlePubChange} className="rd-input" />
                                </div>
                            </div>
                            <div>
                                <label className="rd-label">Journal / Conference</label>
                                <input name="journal_name" value={pubForm.journal_name} onChange={handlePubChange} placeholder="Journal or conference name..." className="rd-input" />
                            </div>

                            {/* PDF Upload */}
                            <div>
                                <label className="rd-label">
                                    PDF File {editingPubId && pubExistingFile ? "(leave empty to keep current)" : ""}
                                </label>
                                <div className="rd-file-box">
                                    <label htmlFor="pdf-input" className="rd-file-btn">
                                        <FileText size={15} /> Choose PDF
                                    </label>
                                    <input
                                        id="pdf-input"
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handlePubFileChange}
                                        className="rd-file-input-hidden"
                                    />
                                    <span className="rd-file-name">
                                        {pubFile ? pubFile.name : (pubExistingFile ? `Current: ${pubExistingFile}` : "No file selected")}
                                    </span>
                                </div>
                                {pubExistingFile && !pubFile && (
                                    <a
                                        href={`${BASE_URL}/uploads/${pubExistingFile}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rd-view-link rd-view-link--inline"
                                    >
                                        <Eye size={13} /> View current PDF
                                    </a>
                                )}
                            </div>

                            {pubError && <p className="rd-error">{pubError}</p>}

                            <div className="rd-actions-row">
                                <button onClick={closePubModal} disabled={pubSaving} className="rd-cancel-btn">Cancel</button>
                                <button onClick={submitPub} disabled={pubSaving} className="rd-save-btn">
                                    {pubSaving ? "Saving..." : (editingPubId ? "Save Changes" : "Save Publication")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ===================== REPORT MODAL ===================== */}
            {showReportModal && (
                <div onClick={() => setShowReportModal(false)} className="rd-overlay">
                    <div onClick={(e) => e.stopPropagation()} className="rd-modal-box">
                        <div className="rd-modal-header">
                            <h2 className="rd-modal-title">Generate Research Report</h2>
                            <button onClick={() => setShowReportModal(false)} className="rd-close-btn"><X size={22} /></button>
                        </div>

                        <div className="rd-fields-col">
                            <div>
                                <label className="rd-label">Filter by Year</label>
                                <select value={reportYear} onChange={(e) => setReportYear(e.target.value)} className="rd-input">
                                    <option value="all">All Years</option>
                                    {availableYears.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            <p className="rd-modal-note">
                                The PDF report will include all <strong>Research Projects</strong> (Active &amp; Completed) and <strong>Publications</strong> titles for the selected period.
                            </p>

                            <div className="rd-actions-row">
                                <button onClick={() => setShowReportModal(false)} className="rd-cancel-btn">Cancel</button>
                                <button onClick={generateReport} className="rd-save-btn">
                                    <FileDown size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}