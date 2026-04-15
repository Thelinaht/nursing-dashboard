const pool = require("../db");

// GET all doc types + nurse's records via user_id
exports.getByUserId = async (userId) => {
    const [nurseRows] = await pool.query(
        "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?",
        [userId]
    );
    if (!nurseRows[0]) return { rows: [], nurseId: null };
    const nurseId = nurseRows[0].nurse_id;

    const [rows] = await pool.query(`
        SELECT
            jdt.doc_type_id,
            jdt.doc_name,
            jdt.parent_id,
            sjd.file_path,
            sjd.notes
        FROM Job_document_type jdt
        LEFT JOIN Staff_job_document sjd
            ON jdt.doc_type_id = sjd.doc_type_id AND sjd.nurse_id = ?
        ORDER BY jdt.doc_type_id
    `, [nurseId]);

    return { rows, nurseId };
};

// UPSERT notes
exports.upsertDocument = async (nurseId, docTypeId, data) => {
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_job_document WHERE nurse_id = ? AND doc_type_id = ?",
        [nurseId, docTypeId]
    );

    if (existing.length > 0) {
        const [result] = await pool.query(
            "UPDATE Staff_job_document SET notes = ? WHERE nurse_id = ? AND doc_type_id = ?",
            [data.notes || null, nurseId, docTypeId]
        );
        return result;
    } else {
        const [result] = await pool.query(
            "INSERT INTO Staff_job_document (nurse_id, doc_type_id, notes) VALUES (?, ?, ?)",
            [nurseId, docTypeId, data.notes || null]
        );
        return result;
    }
};

// Update file path after upload
exports.updateFilePath = async (nurseId, docTypeId, filePath) => {
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_job_document WHERE nurse_id = ? AND doc_type_id = ?",
        [nurseId, docTypeId]
    );
    if (existing.length === 0) {
        await pool.query(
            "INSERT INTO Staff_job_document (nurse_id, doc_type_id) VALUES (?, ?)",
            [nurseId, docTypeId]
        );
    }
    await pool.query(
        "UPDATE Staff_job_document SET file_path = ? WHERE nurse_id = ? AND doc_type_id = ?",
        [filePath, nurseId, docTypeId]
    );
};