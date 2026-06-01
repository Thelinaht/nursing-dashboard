const authModel = require("../models/authModel");
const bcrypt = require("bcryptjs");
const { Resend } = require("resend");

// In-memory OTP store: { email -> { otp, expiresAt, verified } }
const otpStore = {};

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await authModel.getUserByEmail(email);

        if (!user) return res.status(401).json({ message: "User not found" });
        if (!user.password_hash) return res.status(500).json({ message: "Password hash missing in DB" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Invalid password" });

        res.json({ message: "Login successful", user });
    } catch (e) {
        console.error("LOGIN ERROR:", e);
        res.status(500).json({ message: e.message });
    }
};

// ─── STEP 1: Send OTP ────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await authModel.getUserByEmail(email);
        if (!user) return res.status(404).json({ message: "No account found with this email" });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        otpStore[email.toLowerCase()] = { otp, expiresAt };

        const { error } = await resend.emails.send({
            from: "KFHU Nursing System <onboarding@resend.dev>",
            to: email,
            subject: "Your Password Reset OTP – KFHU Nursing Dashboard",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
                    <h2 style="color: #1e3a5f; margin-bottom: 8px;">Password Reset Request</h2>
                    <p style="color: #475569; margin-bottom: 24px;">
                        Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.
                    </p>
                    <div style="background: #1e3a5f; color: white; font-size: 36px; font-weight: 800; letter-spacing: 12px; text-align: center; padding: 20px 32px; border-radius: 10px; margin-bottom: 24px;">
                        ${otp}
                    </div>
                    <p style="color: #94a3b8; font-size: 13px;">
                        If you did not request this, please ignore this email. Your password will remain unchanged.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #cbd5e1; font-size: 12px; text-align: center;">
                        King Fahd University Hospital – IAU AMC © 2025
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("RESEND ERROR:", error);
            return res.status(500).json({ message: "Failed to send OTP. Please try again." });
        }

        console.log(`✅ OTP sent to ${email}: ${otp}`);
        res.json({ message: "OTP sent to your email" });

    } catch (e) {
        console.error("SEND OTP ERROR:", e);
        res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
};

// ─── STEP 2: Verify OTP ───────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

        const record = otpStore[email.toLowerCase()];

        if (!record) return res.status(400).json({ message: "No OTP found. Please request a new one." });
        if (Date.now() > record.expiresAt) {
            delete otpStore[email.toLowerCase()];
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }
        if (record.otp !== otp.trim()) {
            return res.status(400).json({ message: "Incorrect OTP. Please try again." });
        }

        otpStore[email.toLowerCase()].verified = true;
        res.json({ message: "OTP verified" });
    } catch (e) {
        console.error("VERIFY OTP ERROR:", e);
        res.status(500).json({ message: e.message });
    }
};

// ─── STEP 3: Reset password ───────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        const record = otpStore[email?.toLowerCase()];
        if (!record || !record.verified) {
            return res.status(403).json({ message: "OTP not verified. Please complete the verification step." });
        }

        const user = await authModel.getUserByEmail(email);
        if (!user) return res.status(404).json({ message: "User not found" });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await authModel.updatePassword(user.user_id, hash);

        delete otpStore[email.toLowerCase()];

        res.json({ message: "Password reset successful" });
    } catch (e) {
        console.error("RESET PASSWORD ERROR:", e);
        res.status(500).json({ message: e.message });
    }
};