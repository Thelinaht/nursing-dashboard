import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/ResearcherDashboard.css";
import { BookOpen, Microscope, Presentation } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ResearcherDashboard() {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("user"));
            if (storedUser) setUser(storedUser);
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

    const currentYear = new Date().getFullYear();
    const totalPubsThisYear = publications.filter(p => new Date(p.date).getFullYear() === currentYear).length;
    const activeProjects = projects.filter(p => p.status === "Active").length;
    const conferencePresentations = publications.filter(p => p.type === "Presentation" || p.type === "Poster").length;

    const utilizationData = [
        { year: '2021', articles: 12, protocolsAdapted: 3 },
        { year: '2022', articles: 15, protocolsAdapted: 5 },
        { year: '2023', articles: 20, protocolsAdapted: 8 },
        { year: '2024', articles: 28, protocolsAdapted: 14 },
        { year: '2025', articles: 35, protocolsAdapted: 22 },
    ];

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

                {/* Header */}
                <div className="rd-header">
                    <div>
                        <h1>Research Dashboard</h1>
                        <p>Research Director · Overview & EBP Metrics</p>
                    </div>
                </div>

                {loading ? (
                    <p>Loading research data...</p>
                ) : (
                    <>
                        {/* ── KPI Cards ── */}
                        <div className="rd-kpi-grid">
                            <div className="glass-card blue">
                                <p><BookOpen size={22} /> Publications This Year</p>
                                <h1>{totalPubsThisYear}</h1>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}></div>
                            </div>
                            <div className="glass-card purple">
                                <p><Microscope size={22} /> Active Research Projects</p>
                                <h1>{activeProjects}</h1>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}></div>
                            </div>
                            <div className="glass-card yellow">
                                <p><Presentation size={22} /> Conference Presentations</p>
                                <h1>{conferencePresentations}</h1>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}></div>
                            </div>
                        </div>

                        {/* ── Data Utilization Chart ── */}
                        <div className="rd-card">
                            <p className="rd-card-title">Data Utilization & Evidence-Based Practice</p>
                            <p style={{ fontSize: "12px", color: "#5a6f87", marginBottom: "16px" }}>
                                Visualizing the growth in nursing-led research articles and the corresponding internal clinical protocols adapted.
                            </p>
                            <div className="rd-legend-row">
                                <span className="rd-legend-item">
                                    <span className="rd-legend-dot" style={{ background: "#5a6f87" }} />
                                    Published Articles
                                </span>
                                <span className="rd-legend-item">
                                    <span className="rd-legend-dot" style={{ background: "#9fb3cc" }} />
                                    Protocols Adapted
                                </span>
                            </div>
                            <div style={{ height: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,111,135,0.1)" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f87" }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(90,111,135,0.05)' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', background: '#2f3e55', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                            labelStyle={{ color: 'white' }}
                                            itemStyle={{ color: 'rgba(255,255,255,0.85)' }}
                                        />
                                        <Bar dataKey="articles" fill="#5a6f87" radius={[4, 4, 0, 0]} barSize={30} name="Published Articles" />
                                        <Bar dataKey="protocolsAdapted" fill="#9fb3cc" radius={[4, 4, 0, 0]} barSize={30} name="Protocols Adapted" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ── Research Projects Table ── */}
                        <div className="rd-card">
                            <p className="rd-card-title">Active & Recent Research Projects</p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid rgba(90,111,135,0.15)", textAlign: "left", color: "#5a6f87" }}>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Project Title</th>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Principal Investigator</th>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Start Date</th>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((proj) => (
                                            <tr key={proj.project_id} style={{ borderBottom: "1px solid rgba(90,111,135,0.08)" }}>
                                                <td style={{ padding: "12px 8px", fontWeight: "500", color: "#2f3e55" }}>{proj.title}</td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{proj.investigator_name}</td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{new Date(proj.start_date).toLocaleDateString()}</td>
                                                <td style={{ padding: "12px 8px" }}>
                                                    <span className={`rd-badge ${getStatusBadge(proj.status)}`}>{proj.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Publications Table ── */}
                        <div className="rd-card">
                            <p className="rd-card-title">Department Publications & Presentations</p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid rgba(90,111,135,0.15)", textAlign: "left", color: "#5a6f87" }}>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Title</th>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Author</th>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Type</th>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Date</th>
                                            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Journal / Conference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {publications.map((pub) => (
                                            <tr key={pub.publication_id} style={{ borderBottom: "1px solid rgba(90,111,135,0.08)" }}>
                                                <td style={{ padding: "12px 8px", fontWeight: "500", color: "#2f3e55" }}>{pub.title}</td>
                                                <td style={{ padding: "12px 8px", color: "#5a6f87" }}>{pub.author_name}</td>
                                                <td style={{ padding: "12px 8px" }}>
                                                    <span style={{
                                                        background: "rgba(47,62,85,0.1)", padding: "4px 10px",
                                                        borderRadius: "6px", fontSize: "11px", color: "#2f3e55", fontWeight: "600"
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