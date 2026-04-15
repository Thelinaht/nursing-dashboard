import { useState } from "react";
import logo from "../assets/logo.png";
import "../styles/login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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

                // Save user data to localStorage
                localStorage.setItem("user", JSON.stringify(user));

                // Log the user data for debugging
                console.log("User data from backend:", user);

                // Redirect user based on role_name
                switch (user.role_name) {
                    case "nurse":
                        window.location.href = "/nurse-dashboard";
                        break;
                    case "office Secretaries":
                        window.location.href = "/secretary-dashboard";
                        break;
                    case "nursing supervisor":
                        window.location.href = "/supervisor-dashboard";
                        break;
                    case "Associate Director of Nursing - Director of Nursing":
                        window.location.href = "/director-dashboard";
                        break;
                    default:
                        alert("Unknown role");
                }
            } else {
                alert(data.message);
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
                <div className="login__card">
                    <h2 className="login__title">Login</h2>

                    <form className="login__form" onSubmit={onSubmit}>
                        <div className="login__field">
                            <label htmlFor="email" className="login__label">Email</label>
                            <input
                                id="email"
                                className="login__input"
                                type="email"
                                placeholder="Enter your email here..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login__field">
                            <label htmlFor="password" className="login__label">Password</label>
                            <input
                                id="password"
                                className="login__input"
                                type="password"
                                placeholder="Enter your password here..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="login__btn" type="submit">
                            Login
                        </button>

                        <button
                            className="login__link"
                            type="button"
                            onClick={() => alert("Later: Forgot password flow")}
                        >
                            Forget Password?
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}