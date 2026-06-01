import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import RequestsTable from "../components/RequestsTable";
import io from "socket.io-client";

export default function ManageRequests() {
    const [requests, setRequests] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const user = JSON.parse(sessionStorage.getItem("user"));
    const supervisorUnit = user?.unit || null;

    const fetchRequests = async () => {
        try {
            // If supervisor has a unit, fetch only requests from that unit
            const url = supervisorUnit
                ? `http://localhost:4000/api/requests/by-unit?unit=${encodeURIComponent(supervisorUnit)}`
                : "http://localhost:4000/api/requests";
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) setRequests(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchRequests();
        const socket = io("http://localhost:4000");
        socket.on("request_updated", fetchRequests);
        return () => { socket.off("request_updated"); socket.disconnect(); };
    }, []);

    return (
        <Layout role="supervisor" username={user?.full_name || "Supervisor"}>
            <div style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: 24 }}>
                    <h2 style={{ margin: 0, color: "#1a2b3c" }}>Manage Requests</h2>
                    {supervisorUnit && (
                        <span style={{ background: "#dce6f2", color: "#3b4c6e", padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600 }}>
                            {supervisorUnit}
                        </span>
                    )}
                </div>
                <RequestsTable
                    requests={requests}
                    pendingStatus="Pending_Supervisor"
                    apiEndpoint="/api/approvals/supervisor"
                    modalTitle="Supervisor Decision"
                    onRefresh={fetchRequests}
                    showHistory={showHistory}
                    onToggleHistory={() => setShowHistory(h => !h)}
                />
            </div>
        </Layout>
    );
}