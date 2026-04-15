const bcrypt = require("bcrypt");
const pool = require("../db");

const createUser = async (req, res) => {
    try {
        const { email, password, role_id } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. insert user
        const [result] = await pool.query(
            "INSERT INTO User (email, password_hash) VALUES (?, ?)",
            [email, hashedPassword]
        );

        const user_id = result.insertId;

        // 2. insert role
        await pool.query(
            "INSERT INTO UserRole (user_id, role_id) VALUES (?, ?)",
            [user_id, role_id]
        );

        // 3. create nurse record with NOT NULL defaults
        await pool.query(
            `INSERT INTO Nursing_staff (user_id, full_name, job_title, status)
             VALUES (?, ?, ?, ?)`,
            [user_id, "New Staff", "Unassigned", "Active"]
        );

        res.json({ user_id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// DELETE user — cascades to Nursing_staff, UserRole automatically
const deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params;

        const [result] = await pool.query(
            "DELETE FROM User WHERE user_id = ?",
            [user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ success: true, message: "User deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createUser, deleteUser };