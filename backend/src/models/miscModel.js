const pool = require("../db");

// GET all types + nurse's files via user_id
exports.getByUserId = async (userId) => {
    const [nurseRows] = await pool.query(
        "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?",
        [userId]
    );
    if (!nurseRows[0]) return { types: [], files: [], nurseId: null };
    const nurseId = nurseRows[0].nurse_id;

    // All types
    const [types] = await pool.query(
        "SELECT * FROM Misc_document_type ORDER BY misc_type_id"
    );

    // All files for this nurse
    const [files] = await pool.query(
        `SELECT * FROM Staff_misc_document WHERE nurse_id = ? ORDER BY uploaded_at DESC`,
        [nurseId]
    );

    return { types, files, nurseId };
};

// Add file
exports.addFile = async (nurseId, miscTypeId, fileName, filePath) => {
    const [result] = await pool.query(
        `INSERT INTO Staff_misc_document (nurse_id, misc_type_id, file_name, file_path)
         VALUES (?, ?, ?, ?)`,
        [nurseId, miscTypeId, fileName, filePath]
    );
    return result;
};

// Delete file
exports.deleteFile = async (docId, nurseId) => {
    const [result] = await pool.query(
        "DELETE FROM Staff_misc_document WHERE doc_id = ? AND nurse_id = ?",
        [docId, nurseId]
    );
    return result;
};