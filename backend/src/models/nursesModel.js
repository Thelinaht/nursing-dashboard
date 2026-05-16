<<<<<<< HEAD
const pool = require("../db");

// GET all
exports.getAllNurses = async () => {
    const [rows] = await pool.query("SELECT * FROM Nursing_staff");
    return rows;
};

// GET one
exports.getNurseById = async (id) => {
    const [rows] = await pool.query(
        `SELECT 
            ns.*, 
            u.email,
            ns.mobile_number AS phone,
            ns.birth_date_gregorian AS date_of_birth,
            ns.hire_date AS employment_start_date,
            ns.hire_date AS start_date,
            sl.expiry_date AS license_expiry,
            sl.expiry_date AS license_expiry_date,
            CASE
                WHEN sl.expiry_date < CURDATE() THEN 'Expired'
                WHEN sl.expiry_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Expiring Soon'
                ELSE 'Valid'
            END AS license_status
         FROM Nursing_staff ns
         LEFT JOIN User u ON ns.user_id = u.user_id
         LEFT JOIN Staff_license sl ON ns.nurse_id = sl.nurse_id
         WHERE ns.nurse_id = ?`,
        [id]
    );
    return rows[0];
};

// CREATE
exports.createNurse = async (data) => {
    const {
        user_id,
        full_name,
        unit,
        job_title,
        qualification,
        license_number,
        status,
        hire_date
    } = data;

    const [result] = await pool.query(
        `INSERT INTO Nursing_staff 
        (user_id, full_name, unit, job_title, qualification, license_number, status, hire_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, full_name, unit, job_title, qualification, license_number, status, hire_date]
    );

    return result;
};
// UPDATE
exports.updateNurse = async (id, data) => {
    const [result] = await pool.query(
        `UPDATE Nursing_staff SET ? WHERE nurse_id = ?`,
        [data, id]
    );

    return result;
};

// DELETE
exports.deleteNurse = async (id) => {
    const [result] = await pool.query(
        "DELETE FROM Nursing_staff WHERE nurse_id=?",
        [id]
    );

    return result;
};

exports.getNurseByUserId = async (user_id) => {
    const [rows] = await pool.query(
        `SELECT 
            ns.*, 
            u.email,
            ns.mobile_number AS phone,
            ns.birth_date_gregorian AS date_of_birth,
            ns.hire_date AS employment_start_date,
            ns.hire_date AS start_date,
            sl.expiry_date AS license_expiry,
            sl.expiry_date AS license_expiry_date,
            CASE
                WHEN sl.expiry_date < CURDATE() THEN 'Expired'
                WHEN sl.expiry_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Expiring Soon'
                ELSE 'Valid'
            END AS license_status
         FROM Nursing_staff ns
         LEFT JOIN User u ON ns.user_id = u.user_id
         LEFT JOIN Staff_license sl ON ns.nurse_id = sl.nurse_id
         WHERE ns.user_id = ?`,
        [user_id]
    );
    return rows[0];
=======
const pool = require("../db");

// GET all
exports.getAllNurses = async () => {
    const [rows] = await pool.query("SELECT * FROM Nursing_staff");
    return rows;
};

// GET one
exports.getNurseById = async (id) => {
    const [rows] = await pool.query(
        `SELECT 
            ns.*, 
            u.email,
            ns.mobile_number AS phone,
            ns.birth_date_gregorian AS date_of_birth,
            ns.hire_date AS employment_start_date,
            ns.hire_date AS start_date,
            sl.expiry_date AS license_expiry,
            sl.expiry_date AS license_expiry_date,
            CASE
                WHEN sl.expiry_date < CURDATE() THEN 'Expired'
                WHEN sl.expiry_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Expiring Soon'
                ELSE 'Valid'
            END AS license_status
         FROM Nursing_staff ns
         LEFT JOIN User u ON ns.user_id = u.user_id
         LEFT JOIN Staff_license sl ON ns.nurse_id = sl.nurse_id
         WHERE ns.nurse_id = ?`,
        [id]
    );
    return rows[0];
};

// CREATE
exports.createNurse = async (data) => {
    const {
        user_id,
        full_name,
        unit,
        job_title,
        qualification,
        license_number,
        status,
        hire_date
    } = data;

    const [result] = await pool.query(
        `INSERT INTO Nursing_staff 
        (user_id, full_name, unit, job_title, qualification, license_number, status, hire_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, full_name, unit, job_title, qualification, license_number, status, hire_date]
    );

    return result;
};
// UPDATE
exports.updateNurse = async (id, data) => {
    const [result] = await pool.query(
        `UPDATE Nursing_staff SET ? WHERE nurse_id = ?`,
        [data, id]
    );

    return result;
};

// DELETE
exports.deleteNurse = async (id) => {
    const [result] = await pool.query(
        "DELETE FROM Nursing_staff WHERE nurse_id=?",
        [id]
    );

    return result;
};

exports.getNurseByUserId = async (user_id) => {
    const [rows] = await pool.query(
        `SELECT 
            ns.*, 
            u.email,
            ns.mobile_number AS phone,
            ns.birth_date_gregorian AS date_of_birth,
            ns.hire_date AS employment_start_date,
            ns.hire_date AS start_date,
            sl.expiry_date AS license_expiry,
            sl.expiry_date AS license_expiry_date,
            CASE
                WHEN sl.expiry_date < CURDATE() THEN 'Expired'
                WHEN sl.expiry_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Expiring Soon'
                ELSE 'Valid'
            END AS license_status
         FROM Nursing_staff ns
         LEFT JOIN User u ON ns.user_id = u.user_id
         LEFT JOIN Staff_license sl ON ns.nurse_id = sl.nurse_id
         WHERE ns.user_id = ?`,
        [user_id]
    );
    return rows[0];
>>>>>>> 6e3f2e2 (last updates)
};