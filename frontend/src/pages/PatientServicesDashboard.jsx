import Layout from "../components/Layout";
import { useEffect, useState } from "react";

export default function PatientServicesDashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("user"));
            if (storedUser) {
                setUser(storedUser);
            }
        } catch (err) {
            console.error("Failed to parse user from session storage", err);
        }
    }, []);

    return (
        <Layout role="patient_services" username={user?.full_name || JSON.parse(sessionStorage.getItem("user"))?.full_name || "Assistant Director"}>
            <div style={{ padding: "24px" }}>
                <h1 style={{ fontSize: "24px", color: "#2f3e55", marginBottom: "8px" }}>Patient Services Dashboard</h1>
                <p style={{ color: "#5a6f87", fontSize: "14px" }}>Assistant Director of Nursing for Patient Services</p>

                <div style={{
                    marginTop: "32px",
                    padding: "48px",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px dashed #dce6f2",
                    textAlign: "center",
                    color: "#5a6f87"
                }}>
                    <h2>Welcome to the Patient Services Dashboard</h2>
                </div>
            </div>
        </Layout>
    );
}
