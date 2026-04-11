const pool = require("../db");

// GET all
exports.getAllNurses = async () => {
    const [rows] = await pool.query("SELECT * FROM Nursing_staff");
    return rows;
};

// GET one
exports.getNurseById = async (id) => {
    const [rows] = await pool.query(
        "SELECT * FROM Nursing_staff WHERE nurse_id = ?",
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
