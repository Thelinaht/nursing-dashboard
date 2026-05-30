import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import RequestsTable from "../components/RequestsTable";
import "../styles/design-system.css";
import "../styles/PatientServicesDashboard.css";
import { Users, Building2, ClipboardList } from "lucide-react";
import io from "socket.io-client";

export default function PatientServicesDashboard() {
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [kpis, setKpis] = useState({ totalNurses: null, totalUnits: null, pendingRequests: null });

    useEffect(() => {
        try {
            const u = JSON.parse(sessionStorage.getItem("user"));
            if (u) setUser(u);
        } catch (err) { console.error(err); }
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch("http://localhost:4000/api/requests");
            const data = await res.json();
            if (Array.isArray(data)) setRequests(data);
        } catch (err) { console.error(err); }
    };

    const fetchKPIs = async () => {
        try {
            const [nursesRes, reqRes] = await Promise.all([
                fetch("http://localhost:4000/api/nurses"),
                fetch("http://localhost:4000/api/requests"),
            ]);
            const nurses = await nursesRes.json();
            const reqs = await reqRes.json();
            const units = new Set(nurses.map(n => n.unit).filter(Boolean));
            const pending = reqs.filter(r => r.current_status === "Pending_Assistant");
            setKpis({ totalNurses: nurses.length, totalUnits: units.size, pendingRequests: pending.length });
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchRequests();
        fetchKPIs();
        const socket = io("http://localhost:4000");
        socket.on("request_updated", () => { fetchRequests(); fetchKPIs(); });
        return () => { socket.off("request_updated"); socket.disconnect(); };
    }, []);

    return (
        <Layout role="assistantDirector" username={user?.full_name || "User"}>
            <div className="psd-container">

                <div className="psd-header">
                    <h1>Assistant Director Dashboard</h1>
                </div>

                <div className="psd-summary-grid">
                    <div className="glass-card blue">
                        <p><Users size={20} /> Number of Nurses</p>
                        <h1>{kpis.totalNurses ?? "—"}</h1>
                    </div>
                    <div className="glass-card green">
                        <p><Building2 size={20} /> Units</p>
                        <h1>{kpis.totalUnits ?? "—"}</h1>
                    </div>
                    <div className="glass-card yellow">
                        <p><ClipboardList size={20} /> Pending Your Review</p>
                        <h1>{kpis.pendingRequests ?? "—"}</h1>
                    </div>
                </div>

                <RequestsTable
                    requests={requests}
                    pendingStatus="Pending_Assistant"
                    apiEndpoint="/api/approvals/assistant"
                    modalTitle="Assistant Director Decision"
                    onRefresh={() => { fetchRequests(); fetchKPIs(); }}
                    showHistory={showHistory}
                    onToggleHistory={() => setShowHistory(h => !h)}
                />

            </div>
        </Layout>
    );
}