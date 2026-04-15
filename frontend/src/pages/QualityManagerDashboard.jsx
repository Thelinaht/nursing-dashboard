import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function QualityManagerDashboard() {

    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <Layout
            role="qualityManager"
            logoSrc="/logo.png"
            username={user?.full_name || "Quality Manager"}
        >
            <div>
                <h1>Quality Manager Dashboard</h1>
                <p>Nursing Manager for Quality</p>
            </div>
        </Layout>
    );
}