import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/login.css";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://localhost:4000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                const user = data.user;

                // Save user data to sessionStorage
                sessionStorage.setItem("user", JSON.stringify(user));


                //  توجيه حسب الرول
                if (user.role_id === 1) { // nurse
                    window.location.href = "/nurse-dashboard";
                } else if (user.role_id === 2) { // office Secretaries
                    window.location.href = "/secretary-dashboard";
                } else if (user.role_id === 3) { // nursing supervisor
                    window.location.href = "/supervisor-dashboard";
                } else if (user.role_id === 4) { // Director of Nursing
                    window.location.href = "/director-dashboard";
                } else if (user.role_id === 5) { // Nursing Manager for Quality
                    window.location.href = "/quality-manager-dashboard";
                } else if (user.role_id === 6) { // Training Director
                    window.location.href = "/training-director-dashboard";
                } else if (user.role_id === 7) { // researcher
                    window.location.href = "/researcher-dashboard";
                } else if (user.role_id === 8) { // patient_services
                    window.location.href = "/patient-services-dashboard";
                } else {
                    alert("Unknown role ID: " + user.role_id);
                }


            } else {
                alert(data.message || data.error || "An unknown error occurred.");
            }
        } catch (err) {
            console.error("ERROR:", err);
            alert("Server error");
        }
    };

    return (
        <div className="login">
            {/* Left */}
            <div className="login__left">
                <img className="login__logo" src={logo} alt="Nursing Dashboard logo" />
            </div>

            {/* Divider */}
            <div className="login__divider" />

            {/* Right */}
            <div className="login__right">
                <div className="login__container">
                    <div className="login__header">
                        <p className="login__tagline">Nursing Services Management System</p>
                        <div className="login__accent" />
                        <h2 className="login__title">Login</h2>
                    </div>

                    <form className="login__form" onSubmit={onSubmit}>
                        <div className="login__field">
                            <label htmlFor="email" className="login__label">Email Address</label>
                            <input
                                id="email"
                                className="login__input"
                                type="email"
                                placeholder="name@kuh.edu.sa"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login__field">
                            <label htmlFor="password" className="login__label">Password</label>
                            <div className="login__input-wrapper">
                                <input
                                    id="password"
                                    className="login__input login__input--password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="login__password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="login__actions">
                            <button className="login__btn" type="submit">
                                Login <ArrowRight size={18} className="login__btn-icon" />
                            </button>

                            <button
                                className="login__forgot"
                                type="button"
                                onClick={() => navigate("/reset-password")}
                            >
                                Forget Password?
                            </button>
                        </div>
                    </form>
                </div>

                <div className="login__footer">
                    © 2025 King Fahd University Hospital – IAU AMC
                </div>
            </div>
        </div>
    );
}
