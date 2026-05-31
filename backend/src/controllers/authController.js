const authModel = require("../models/authModel");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Email:", email);
        console.log("Password:", password);

        const user = await authModel.getUserByEmail(email);

        console.log(" User from DB:", user);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // IMPORTANT: check if password_hash exists
        if (!user.password_hash) {
            return res.status(500).json({ message: "Password hash missing in DB" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        console.log(" Match:", isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        res.json({
            message: "Login successful",
            user: user
        });

    } catch (e) {
        console.error("ERROR:", e);
        res.status(500).json({ message: e.message, error: e.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await authModel.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await authModel.updatePassword(user.user_id, hash);

        res.json({ message: "Password reset successful" });
    } catch (e) {
        console.error("ERROR:", e);
        res.status(500).json({ message: e.message });
    }
};