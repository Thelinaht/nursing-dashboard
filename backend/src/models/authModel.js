const pool = require("../db");


exports.getUserByEmail = async (email) => {
    const [rows] = await pool.query(`
        SELECT u.user_id, u.email, u.password_hash, ur.role_id
        FROM User u
        LEFT JOIN UserRole ur ON u.user_id = ur.user_id
        WHERE u.email = ?
    `, [email]);

    return rows[0];
};

