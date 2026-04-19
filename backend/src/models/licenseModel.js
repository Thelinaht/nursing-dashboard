const pool = require("../db");

// GET all licenses with nurse info + days remaining
exports.getAllLicenses = async () => {
    const [rows] = await pool.query(`
        SELECT
            sl.license_id,
            sl.nurse_id,
            ns.full_name,
            ns.unit,
            ns.job_title,
            sl.license_number,
            sl.issue_date,
            sl.expiry_date,
            sl.issuing_authority,
            DATEDIFF(sl.expiry_date, CURDATE()) AS days_remaining
        FROM Staff_license sl
        JOIN Nursing_staff ns ON sl.nurse_id = ns.nurse_id
        WHERE sl.expiry_date IS NOT NULL
        ORDER BY sl.expiry_date ASC
    `);
    return rows;
};

// GET expired + expiring soon (within 90 days)
exports.getExpiringLicenses = async () => {
    const [rows] = await pool.query(`
        SELECT
            sl.license_id,
            sl.nurse_id,
            ns.full_name,
            ns.user_id,
            ns.unit,
            ns.job_title,
            sl.license_number,
            sl.issue_date,
            sl.expiry_date,
            sl.issuing_authority,
            DATEDIFF(sl.expiry_date, CURDATE()) AS days_remaining
        FROM Staff_license sl
        JOIN Nursing_staff ns ON sl.nurse_id = ns.nurse_id
        WHERE sl.expiry_date IS NOT NULL
          AND DATEDIFF(sl.expiry_date, CURDATE()) <= 90
        ORDER BY sl.expiry_date ASC
    `);
    return rows;
};

// GET license for specific nurse by user_id
exports.getByUserId = async (userId) => {
    const [rows] = await pool.query(`
        SELECT
            sl.license_id,
            sl.license_number,
            sl.issue_date,
            sl.expiry_date,
            sl.issuing_authority,
            sl.certificate_file_path,
            DATEDIFF(sl.expiry_date, CURDATE()) AS days_remaining
        FROM Staff_license sl
        JOIN Nursing_staff ns ON sl.nurse_id = ns.nurse_id
        WHERE ns.user_id = ?
    `, [userId]);
    return rows[0] || null;
};

// UPDATE certificate_file_path by license_id
exports.updateCertificatePath = async (licenseId, filePath) => {
    await pool.query(
        "UPDATE Staff_license SET certificate_file_path = ? WHERE license_id = ?",
        [filePath, licenseId]
    );
};

// UPSERT expiry_date and license_number
exports.upsertByUserId = async (userId, data) => {
    const [nurseRows] = await pool.query(
        "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?", [userId]
    );
    if (!nurseRows[0]) return null;
    const nurseId = nurseRows[0].nurse_id;

    const [existing] = await pool.query(
        "SELECT license_id FROM Staff_license WHERE nurse_id = ?", [nurseId]
    );

    if (existing.length > 0) {
        await pool.query(
            "UPDATE Staff_license SET license_number = ?, expiry_date = ? WHERE nurse_id = ?",
            [data.license_number || null, data.expiry_date || null, nurseId]
        );
        return existing[0].license_id;
    } else {
        const [result] = await pool.query(
            "INSERT INTO Staff_license (nurse_id, license_number, expiry_date, issuing_authority) VALUES (?, ?, ?, 'SCFHS')",
            [nurseId, data.license_number || null, data.expiry_date || null]
        );
        return result.insertId;
    }
};