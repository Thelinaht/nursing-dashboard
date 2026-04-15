const pool = require("../db");

//for the secretary when they see the stsff details
// GET all orientation items + nurse's record via user_id
exports.getByUserId = async (userId) => {
    const [nurseRows] = await pool.query(
        "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?",
        [userId]
    );
    if (!nurseRows[0]) return { rows: [], nurseId: null };
    const nurseId = nurseRows[0].nurse_id;

    const [rows] = await pool.query(`
        SELECT
            oi.item_id,
            oi.item_name,
            so.expiry_date,
            so.file_path
        FROM Orientation_item oi
        LEFT JOIN Staff_orientation so
            ON oi.item_id = so.item_id AND so.nurse_id = ?
        ORDER BY oi.item_id
    `, [nurseId]);

    return { rows, nurseId };
};

// UPSERT orientation record
exports.upsertOrientation = async (nurseId, itemId, data) => {
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_orientation WHERE nurse_id = ? AND item_id = ?",
        [nurseId, itemId]
    );

    if (existing.length > 0) {
        const [result] = await pool.query(
            `UPDATE Staff_orientation SET expiry_date = ? WHERE nurse_id = ? AND item_id = ?`,
            [data.expiry_date || null, nurseId, itemId]
        );
        return result;
    } else {
        const [result] = await pool.query(
            `INSERT INTO Staff_orientation (nurse_id, item_id, expiry_date) VALUES (?, ?, ?)`,
            [nurseId, itemId, data.expiry_date || null]
        );
        return result;
    }
};

// Update file path after upload
exports.updateFilePath = async (nurseId, itemId, filePath) => {
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_orientation WHERE nurse_id = ? AND item_id = ?",
        [nurseId, itemId]
    );
    if (existing.length === 0) {
        await pool.query(
            "INSERT INTO Staff_orientation (nurse_id, item_id) VALUES (?, ?)",
            [nurseId, itemId]
        );
    }
    await pool.query(
        "UPDATE Staff_orientation SET file_path = ? WHERE nurse_id = ? AND item_id = ?",
        [filePath, nurseId, itemId]
    );
};