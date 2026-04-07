import { useEffect, useState } from "react";
import "../styles/SecretaryDashboard.css";

export default function SecretaryDashboard() {
    const [nurses, setNurses] = useState([]);

    useEffect(() => {
        fetch("http://localhost:4000/api/nurses")
            .then(res => res.json())
            .then(data => setNurses(data))
            .catch(err => console.error(err));
    }, []);

    const totalNurses = nurses.length;
    const expired = nurses.filter(n => n.status === "EOC").length;

    return (
        <div className="dashboard">

            {/* Sidebar */}
            <div className="sidebar">
                <h2 className="logo">Nursing Dashboard</h2>

                <ul>
                    <li
                        className="nav-item active"
                        onClick={() => window.location.href = "/secretary-dashboard"}
                    >
                        Dashboard
                    </li>

                    <li
                        className="nav-item"
                        onClick={() => window.location.href = "/notifications"}
                    >
                        Notifications
                    </li>
                </ul>

                <button
                    className="logout"
                    onClick={() => {
                        localStorage.removeItem("user");
                        window.location.href = "/";
                    }}
                >
                    Log out
                </button>
            </div>

            {/* Main */}
            <div className="main">

                <h1 className="title">Dashboard</h1>

                {/* Cards */}
                <div className="cards">
                    <div className="card big">
                        <p>Total Nurses</p>
                        <h1>{totalNurses}</h1>
                    </div>

                    <div className="card big danger">
                        <p>Expired License</p>
                        <h1>{expired}</h1>
                    </div>

                    <button className="add-btn">+ Add Nurse</button>
                </div>

                {/* Header */}
                <div className="list-header">
                    <span>Name</span>
                    <span>Iqama</span>
                    <span>Job Title</span>
                    <span>Position</span>
                    <span>Unit</span>
                    <span>Status</span>
                </div>

                {/* List */}
                <div className="nurses-list">
                    {nurses.map(nurse => (
                        <div
                            key={nurse.nurse_id}
                            className="nurse-card"
                            onClick={() => {
                                window.location.href = `/nurse/${nurse.nurse_id}`;
                            }}
                        >
                            <div>{nurse.full_name}</div>
                            <div>{nurse.national_id_iqama}</div>
                            <div>{nurse.job_title}</div>
                            <div>{nurse.position_title}</div>
                            <div>{nurse.unit}</div>

                            <div>
                                <span className={`status ${nurse.status.toLowerCase()}`}>
                                    {nurse.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}