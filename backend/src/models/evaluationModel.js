const pool = require("../db");

// GET all eval types + nurse's records via user_id
exports.getByUserId = async (userId) => {
    const [nurseRows] = await pool.query(
        "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?",
        [userId]
    );
    if (!nurseRows[0]) return { rows: [], nurseId: null };
    const nurseId = nurseRows[0].nurse_id;

    const [rows] = await pool.query(`
        SELECT
            et.eval_type_id,
            et.eval_name,
            se.file_path
        FROM Evaluation_type et
        LEFT JOIN Staff_evaluation se
            ON et.eval_type_id = se.eval_type_id AND se.nurse_id = ?
        ORDER BY et.eval_type_id
    `, [nurseId]);

    return { rows, nurseId };
};

// Update file path after upload
exports.updateFilePath = async (nurseId, evalTypeId, filePath) => {
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_evaluation WHERE nurse_id = ? AND eval_type_id = ?",
        [nurseId, evalTypeId]
    );
    if (existing.length === 0) {
        await pool.query(
            "INSERT INTO Staff_evaluation (nurse_id, eval_type_id) VALUES (?, ?)",
            [nurseId, evalTypeId]
        );
    }
    await pool.query(
        "UPDATE Staff_evaluation SET file_path = ? WHERE nurse_id = ? AND eval_type_id = ?",
        [filePath, nurseId, evalTypeId]
    );
};