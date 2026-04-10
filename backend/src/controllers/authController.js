const authModel = require("../models/authModel");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("📩 Email:", email);
        console.log("🔑 Password:", password);

        const user = await authModel.getUserByEmail(email);

        console.log("👤 User from DB:", user);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // ⚠️ IMPORTANT: check if password_hash exists
        if (!user.password_hash) {
            return res.status(500).json({ message: "Password hash missing in DB" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        console.log("✅ Match:", isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        res.json({
            message: "Login successful",
            user: {
                user_id: user.user_id,
                email: user.email,
                role_id: user.role_id, // ✅ الآن موجود
                nurse_id: user.nurse_id
            }
        });

    } catch (e) {
        console.error("❌ ERROR:", e);
        res.status(500).json({ error: e.message });
    }
};