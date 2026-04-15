const pool = require("../db");

// CREATE USER
exports.createUser = async (email, passwordHash) => {

    const [result] = await pool.query(
        `INSERT INTO User (email, password_hash) VALUES (?, ?)`,
        [email, passwordHash]
    );

    return result.insertId; // user_id
};