import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function DirectorDashboard() {

    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <Layout
            role="director"
            logoSrc="/logo.png"
            username={user?.full_name || "Director"}
        >
            <div>
                <h1>Director Dashboard</h1>
                <p>Associate Director of Nursing - Director of Nursing</p>
            </div>
        </Layout>
    );
}