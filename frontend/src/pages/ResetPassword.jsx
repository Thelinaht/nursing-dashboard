import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Mail, ShieldCheck, KeyRound } from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/login.css";
import "../styles/ResetPassword.css";

// 3 steps: "email" → "otp" → "password"
export default function ResetPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState("email");

    // Step 1
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);

    // Step 2
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [verifying, setVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);

    // Step 3
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Cooldown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    // ── Step 1: Send OTP ─────────────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await fetch("http://localhost:4000/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setStep("otp");
            setResendCooldown(60);
        } catch (err) {
            alert(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setSending(false);
        }
    };

    // ── Step 2: OTP input helpers ─────────────────────────────────────────────
    const handleOtpChange = (val, idx) => {
        const digit = val.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[idx] = digit;
        setOtp(next);
        if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (e, idx) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
        const next = [...otp];
        digits.forEach((d, i) => { next[i] = d; });
        setOtp(next);
        otpRefs.current[Math.min(digits.length, 5)]?.focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length < 6) { alert("Please enter the full 6-digit OTP."); return; }
        setVerifying(true);
        try {
            const res = await fetch("http://localhost:4000/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setStep("password");
        } catch (err) {
            alert(err.message || "Verification failed. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setSending(true);
        try {
            const res = await fetch("http://localhost:4000/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setOtp(["", "", "", "", "", ""]);
            setResendCooldown(60);
        } catch (err) {
            alert(err.message || "Failed to resend OTP.");
        } finally {
            setSending(false);
        }
    };

    // ── Step 3: Reset password ────────────────────────────────────────────────
    const handleReset = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) { alert("Passwords do not match."); return; }
        if (password.length < 8) { alert("Password must be at least 8 characters."); return; }
        setSubmitting(true);
        try {
            const res = await fetch("http://localhost:4000/api/auth/reset-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess(true);
            setTimeout(() => navigate("/"), 2500);
        } catch (err) {
            alert(err.message || "Failed to reset password.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step indicators ───────────────────────────────────────────────────────
    const steps = [
        { id: "email", icon: Mail, label: "Email" },
        { id: "otp", icon: ShieldCheck, label: "Verify" },
        { id: "password", icon: KeyRound, label: "New Password" },
    ];
    const stepIndex = steps.findIndex(s => s.id === step);

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

                    {/* Step indicator */}
                    <div className="rp-steps">
                        {steps.map((s, i) => {
                            const Icon = s.icon;
                            const done = i < stepIndex;
                            const active = i === stepIndex;
                            return (
                                <div key={s.id} className="rp-step-wrap">
                                    <div className={`rp-step-circle ${done ? "done" : active ? "active" : ""}`}>
                                        {done ? "✓" : <Icon size={16} />}
                                    </div>
                                    <span className={`rp-step-label ${active ? "active" : ""}`}>{s.label}</span>
                                    {i < steps.length - 1 && (
                                        <div className={`rp-step-line ${done ? "done" : ""}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Step 1: Email ───────────────────────────────────── */}
                    {step === "email" && (
                        <form className="login__form" onSubmit={handleSendOtp}>
                            <p className="rp-hint">
                                Enter your registered email address and we'll send you a one-time code.
                            </p>
                            <div className="login__field">
                                <label htmlFor="email" className="login__label">Email Address</label>
                                <input
                                    id="email"
                                    className="login__input"
                                    type="email"
                                    placeholder="name@kuh.edu.sa"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="login__actions">
                                <button className="login__btn" type="submit" disabled={sending}>
                                    {sending ? "Sending OTP…" : "Send OTP"} {!sending && <ArrowRight size={18} className="login__btn-icon" />}
                                </button>
                                <button className="login__forgot" type="button" onClick={() => navigate("/")}
                                    style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                                    <ArrowLeft size={14} /> Back to Login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step 2: OTP ─────────────────────────────────────── */}
                    {step === "otp" && (
                        <form className="login__form" onSubmit={handleVerifyOtp}>
                            <p className="rp-hint">
                                We sent a 6-digit code to <strong>{email}</strong>. Check your inbox (and spam).
                            </p>
                            <div className="rp-otp-row" onPaste={handleOtpPaste}>
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={el => otpRefs.current[idx] = el}
                                        className={`rp-otp-box ${digit ? "filled" : ""}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(e.target.value, idx)}
                                        onKeyDown={e => handleOtpKeyDown(e, idx)}
                                        autoFocus={idx === 0}
                                    />
                                ))}
                            </div>

                            <div className="rp-resend">
                                {resendCooldown > 0
                                    ? <span>Resend in {resendCooldown}s</span>
                                    : <button type="button" className="rp-resend-btn" onClick={handleResend} disabled={sending}>
                                        {sending ? "Sending…" : "Resend OTP"}
                                    </button>
                                }
                            </div>

                            <div className="login__actions">
                                <button className="login__btn" type="submit" disabled={verifying || otp.join("").length < 6}>
                                    {verifying ? "Verifying…" : "Verify OTP"} {!verifying && <ArrowRight size={18} className="login__btn-icon" />}
                                </button>
                                <button className="login__forgot" type="button" onClick={() => setStep("email")}
                                    style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                                    <ArrowLeft size={14} /> Change Email
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step 3: New password ─────────────────────────────── */}
                    {step === "password" && !success && (
                        <form className="login__form" onSubmit={handleReset}>
                            <p className="rp-hint">
                                OTP verified! Choose a new password for <strong>{email}</strong>.
                            </p>

                            <div className="login__field">
                                <label htmlFor="password" className="login__label">New Password</label>
                                <div className="login__input-wrapper">
                                    <input
                                        id="password"
                                        className="login__input login__input--password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button type="button" className="login__password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {password && (
                                    <div className="rp-strength">
                                        <div className={`rp-strength-bar ${password.length >= 12 ? "strong" : password.length >= 8 ? "medium" : "weak"}`} />
                                        <span className="rp-strength-label">
                                            {password.length >= 12 ? "Strong" : password.length >= 8 ? "Medium" : "Too short"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="login__field">
                                <label htmlFor="confirmPassword" className="login__label">Confirm Password</label>
                                <div className="login__input-wrapper">
                                    <input
                                        id="confirmPassword"
                                        className="login__input login__input--password"
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="login__password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="rp-mismatch">Passwords do not match</p>
                                )}
                            </div>

                            <div className="login__actions">
                                <button className="login__btn" type="submit"
                                    disabled={submitting || password.length < 8 || password !== confirmPassword}>
                                    {submitting ? "Saving…" : "Set New Password"} {!submitting && <ArrowRight size={18} className="login__btn-icon" />}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Success ─────────────────────────────────────────── */}
                    {success && (
                        <div className="rp-success">
                            <div className="rp-success-icon">✓</div>
                            <h3>Password Updated!</h3>
                            <p>Your password has been changed successfully. Redirecting to login…</p>
                        </div>
                    )}
                </div>

                <div className="login__footer">
                    © 2025 King Fahd University Hospital – IAU AMC
                </div>
            </div>
        </div>
    );
}