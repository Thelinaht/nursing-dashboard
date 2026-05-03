import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/ResearcherDashboard.css"; // Copied from QualityManagerDashboard.css
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ResearcherDashboard() {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("user"));
            if (storedUser) {
                setUser(storedUser);
            }
        } catch (err) {
            console.error("Failed to parse user from session storage", err);
        }

        const fetchData = async () => {
            try {
                const [projectsRes, pubsRes] = await Promise.all([
                    fetch("http://localhost:4000/api/research/projects"),
                    fetch("http://localhost:4000/api/research/publications")
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

        fetchData();
    }, []);

    // Derived Statistics
    const currentYear = new Date().getFullYear();
    const totalPubsThisYear = publications.filter(p => new Date(p.date).getFullYear() === currentYear).length;
    const activeProjects = projects.filter(p => p.status === "Active").length;
    const conferencePresentations = publications.filter(p => p.type === "Presentation" || p.type === "Poster").length;

    // Chart Data for Data Utilization (Mock trend data showing protocol adoptions based on research)
    const utilizationData = [
        { year: '2021', articles: 12, protocolsAdapted: 3 },
        { year: '2022', articles: 15, protocolsAdapted: 5 },
        { year: '2023', articles: 20, protocolsAdapted: 8 },
        { year: '2024', articles: 28, protocolsAdapted: 14 },
        { year: '2025', articles: 35, protocolsAdapted: 22 },
    ];

    const getStatusBadge = (status) => {
        switch(status) {
            case "Active": return "badge-green";
            case "Completed": return "badge-amber";
            default: return "badge-red";
        }
    };

    return (
        <Layout role="researcher" username={user?.full_name || JSON.parse(sessionStorage.getItem("user"))?.full_name || "Research User"}>
            <div className="qm-container">
                {/* Header */}
                <div className="qm-header">
                    <div>
                        <h1>Research Dashboard</h1>
                        <p>Research Director · Overview & EBP Metrics</p>
                    </div>
                </div>

                {loading ? (
                    <p>Loading research data...</p>
                ) : (
                    <>
                        {/* Section 1: Summary Cards */}
                        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                            <div className="kpi-card">
                                <p className="kpi-label">Publications This Year</p>
                                <h2 className="kpi-value">{totalPubsThisYear}</h2>
                                <p className="kpi-unit">published articles</p>
                            </div>
                            <div className="kpi-card">
                                <p className="kpi-label">Active Research Projects</p>
                                <h2 className="kpi-value">{activeProjects}</h2>
                                <p className="kpi-unit">ongoing studies</p>
                            </div>
                            <div className="kpi-card">
                                <p className="kpi-label">Conference Presentations</p>
                                <h2 className="kpi-value">{conferencePresentations}</h2>
                                <p className="kpi-unit">posters & presentations</p>
                            </div>
                        </div>

                        <div className="charts-grid" style={{ gridTemplateColumns: "1fr" }}>
                            {/* Section 4: Data Utilization Chart */}
                            <div className="chart-card">
                                <p className="chart-title">Data Utilization & Evidence-Based Practice</p>
                                <p style={{ fontSize: "12px", color: "#5a6f87", marginBottom: "16px" }}>
                                    Visualizing the growth in nursing-led research articles and the corresponding internal clinical protocols adapted.
                                </p>
                                <div className="legend-row">
                                    <span className="legend-item"><span className="legend-dot" style={{ background: "#5a6f87" }}></span>Published Articles</span>
                                    <span className="legend-item"><span className="legend-dot" style={{ background: "#9fb3cc" }}></span>Protocols Adapted</span>
                                </div>
                                <div style={{ height: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} />
                                            <Tooltip cursor={{ fill: 'rgba(90,111,135,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="articles" fill="#5a6f87" radius={[4, 4, 0, 0]} barSize={30} />
                                            <Bar dataKey="protocolsAdapted" fill="#9fb3cc" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Research Projects Table */}
                        <div className="chart-card" style={{ marginTop: "14px" }}>
                            <p className="chart-title">Active & Recent Research Projects</p>
                            <div className="table-responsive">
                                <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid #dce6f2", textAlign: "left", color: "#5a6f87" }}>
                                            <th style={{ padding: "12px 8px" }}>Project Title</th>
                                            <th style={{ padding: "12px 8px" }}>Principal Investigator</th>
                                            <th style={{ padding: "12px 8px" }}>Start Date</th>
                                            <th style={{ padding: "12px 8px" }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((proj) => (
                                            <tr key={proj.project_id} style={{ borderBottom: "1px solid #f0f4f9" }}>
                                                <td style={{ padding: "12px 8px", fontWeight: "500", color: "#2f3e55" }}>{proj.title}</td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{proj.investigator_name}</td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{new Date(proj.start_date).toLocaleDateString()}</td>
                                                <td style={{ padding: "12px 8px" }}>
                                                    <span className={`badge ${getStatusBadge(proj.status)}`}>{proj.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 3: Publications Table */}
                        <div className="chart-card" style={{ marginTop: "14px" }}>
                            <p className="chart-title">Department Publications & Presentations</p>
                            <div className="table-responsive">
                                <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid #dce6f2", textAlign: "left", color: "#5a6f87" }}>
                                            <th style={{ padding: "12px 8px" }}>Title</th>
                                            <th style={{ padding: "12px 8px" }}>Author</th>
                                            <th style={{ padding: "12px 8px" }}>Type</th>
                                            <th style={{ padding: "12px 8px" }}>Date</th>
                                            <th style={{ padding: "12px 8px" }}>Journal / Conference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {publications.map((pub) => (
                                            <tr key={pub.publication_id} style={{ borderBottom: "1px solid #f0f4f9" }}>
                                                <td style={{ padding: "12px 8px", fontWeight: "500", color: "#2f3e55" }}>{pub.title}</td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{pub.author_name}</td>
                                                <td style={{ padding: "12px 8px" }}>
                                                    <span style={{ 
                                                        background: "#f0f4f9", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", color: "#5a6f87", fontWeight: "600"
                                                    }}>
                                                        {pub.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{new Date(pub.date).toLocaleDateString()}</td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{pub.journal_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
