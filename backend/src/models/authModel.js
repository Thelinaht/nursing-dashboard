const pool = require("../db");

exports.getUserByEmail = async (email) => {
    const [rows] = await pool.query(`
        SELECT u.user_id, u.email, u.password_hash, ur.role_id, ns.nurse_id, ns.full_name
        FROM User u
        LEFT JOIN UserRole ur ON u.user_id = ur.user_id
        LEFT JOIN Nursing_staff ns ON u.user_id = ns.user_id
        WHERE u.email = ?
    `, [email]);

    return rows[0];
};