import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/login.css";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("http://localhost:4000/api/auth/reset-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password");
            }

            alert("Password reset successful! You can now log in.");
            navigate("/");

        } catch (error) {
            console.error(error);
            alert(error.message || "Server error");
        } finally {
            setSubmitting(false);
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
                        <h2 className="login__title">Reset Password</h2>
                    </div>

                    <form className="login__form" onSubmit={handleReset}>
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
                            <label htmlFor="password" className="login__label">New Password</label>
                            <div className="login__input-wrapper">
                                <input
                                    id="password"
                                    className="login__input login__input--password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
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

                        <div className="login__field">
                            <label htmlFor="confirmPassword" className="login__label">Confirm Password</label>
                            <div className="login__input-wrapper">
                                <input
                                    id="confirmPassword"
                                    className="login__input login__input--password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="login__password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="login__actions">
                            <button className="login__btn" type="submit" disabled={submitting}>
                                {submitting ? "Resetting..." : "Reset Password"} <ArrowRight size={18} className="login__btn-icon" />
                            </button>

                            <button
                                className="login__forgot"
                                type="button"
                                onClick={() => navigate("/")}
                                style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}
                            >
                                <ArrowLeft size={14} /> Back to Login
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