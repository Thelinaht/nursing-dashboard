import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import RequestsTable from "../components/RequestsTable";
import io from "socket.io-client";

export default function ManageRequests() {
    const [requests, setRequests] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const user = JSON.parse(sessionStorage.getItem("user"));

    const fetchRequests = async () => {
        try {
            const res = await fetch("http://localhost:4000/api/requests");
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
                <h2 style={{ marginBottom: 24, color: "#1a2b3c" }}>Manage Requests</h2>
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