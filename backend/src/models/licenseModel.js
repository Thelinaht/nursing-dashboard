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
            sl.notes,
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
            sl.notes,
            DATEDIFF(sl.expiry_date, CURDATE()) AS days_remaining
        FROM Staff_license sl
        JOIN Nursing_staff ns ON sl.nurse_id = ns.nurse_id
        WHERE sl.expiry_date IS NOT NULL
          AND DATEDIFF(sl.expiry_date, CURDATE()) <= 90
        ORDER BY sl.expiry_date ASC
    `);
    return rows;
};