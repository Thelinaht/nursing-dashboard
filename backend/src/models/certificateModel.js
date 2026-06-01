const pool = require("../db");

exports.getNurseIdByUserId = async (userId) => {
    const [rows] = await pool.query(
        `SELECT nurse_id FROM Nursing_staff WHERE user_id = ?`, [userId]
    );
    return rows[0]?.nurse_id || null;
};

// GET all cert types except Saudi Council (ID=1)
exports.getAllTypes = async () => {
    const [rows] = await pool.query(
        `SELECT certificate_type_id, certificate_name, validity_months
         FROM Certificate_type
         WHERE certificate_type_id != 1
         ORDER BY certificate_type_id ASC`
    );
    return rows;
};

// GET staff certificates by nurse_id
exports.getByNurseId = async (nurseId) => {
    const [rows] = await pool.query(
        `SELECT sc.nurse_id, sc.certificate_type_id, sc.certificate_number,
                sc.issue_date, sc.expiry_date, sc.status,
                sc.file_path,
                ct.certificate_name
         FROM Staff_certificate sc
         JOIN Certificate_type ct ON sc.certificate_type_id = ct.certificate_type_id
         WHERE sc.nurse_id = ? AND sc.certificate_type_id != 1`,
        [nurseId]
    );
    return rows;
};

// UPSERT cert data (number, expiry, status) — only if real data provided
exports.upsertByTypeId = async (nurseId, typeId, data) => {
    const expiry = data.expiry_date || null;
    const number = data.certificate_number || null;
    if (!expiry && !number) return; // skip empty rows

    // Check if row already exists
    const [existing] = await pool.query(
        `SELECT 1 FROM Staff_certificate WHERE nurse_id = ? AND certificate_type_id = ?`,
        [nurseId, typeId]
    );

    if (existing.length > 0) {
        // Update only the fields provided
        await pool.query(
            `UPDATE Staff_certificate SET
                certificate_number = ?,
                expiry_date = COALESCE(?, expiry_date),
                status = ?
             WHERE nurse_id = ? AND certificate_type_id = ?`,
            [number, expiry, data.status || "Valid", nurseId, typeId]
        );
    } else {
        // Insert new row only if expiry is provided (required NOT NULL)
        if (!expiry) return;
        await pool.query(
            `INSERT INTO Staff_certificate
                (nurse_id, certificate_type_id, certificate_number, issue_date, expiry_date, status)
             VALUES (?, ?, ?, CURDATE(), ?, ?)`,
            [nurseId, typeId, number, expiry, data.status || "Valid"]
        );
    }
};

// UPSERT file path — works even if row doesn't exist yet
exports.updateFilePath = async (nurseId, typeId, filePath) => {
    await pool.query(
        `INSERT INTO Staff_certificate
            (nurse_id, certificate_type_id, issue_date, expiry_date, status, file_path)
         VALUES (?, ?, CURDATE(), '9999-12-31', 'Valid', ?)
         ON DUPLICATE KEY UPDATE
            file_path = VALUES(file_path)`,
        [nurseId, typeId, filePath]
    );
};