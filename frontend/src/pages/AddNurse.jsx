import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AddNurse.css";
import Layout from "../components/Layout";

export default function AddNurse() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roleId, setRoleId] = useState("");
    const [roles, setRoles] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetch("http://localhost:4000/api/roles")
            .then(res => res.json())
            .then(data => setRoles(data))
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:4000/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password,
                    role_id: roleId
                })
            });

            const data = await res.json();

            // Check for server errors
            if (!res.ok) {
                setError(data.error || "Failed to create user. Please try again.");
                setLoading(false);
                return;
            }

            // Make sure user_id came back correctly
            if (!data.user_id) {
                setError("User created but no ID returned. Please contact support.");
                setLoading(false);
                return;
            }

            navigate(`/nurse/${data.user_id}`);

        } catch (err) {
            console.error(err);
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            role="secretary"
            logoSrc="/logo.png"
            username={JSON.parse(sessionStorage.getItem("user"))?.full_name || "Secretary"}
        >
            <div className="page-center">

                <div className="add-container">
                    <h1>Add New Nurse</h1>

                    {error && (
                        <div style={{
                            color: "red",
                            background: "#fff0f0",
                            border: "1px solid red",
                            borderRadius: "6px",
                            padding: "10px 14px",
                            marginBottom: "16px",
                            fontSize: "14px"
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    <form className="add-form" onSubmit={handleSubmit}>

                        {/* Email */}
                        <div className="input-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">

                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <span
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </span>

                            </div>
                        </div>

                        {/* Role Dropdown */}
                        <div className="input-group">
                            <label>Role</label>

                            <select
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                required
                            >
                                <option value="">Select Role</option>

                                {roles.map(role => (
                                    <option key={role.role_id} value={role.role_id}>
                                        {role.role_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="add-btn" type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create"}
                        </button>

                    </form>
                </div>

            </div>
        </Layout>
    );
}
