const pool = require("../db");

// GET all
exports.getAllRequests = async () => {
    const query = `
        SELECT r.*, n.full_name AS nurse_name 
        FROM Request r
        LEFT JOIN Nursing_staff n ON r.nurse_id = n.user_id
    `;
    const [rows] = await pool.query(query);
    return rows;
};

// GET by nurse id
exports.getRequestsByNurseId = async (nurseId) => {
    const [rows] = await pool.query(
        "SELECT * FROM Request WHERE nurse_id = ?",
        [nurseId]
    );

    return rows;
};

// GET one
exports.getRequestById = async (id) => {
    const [rows] = await pool.query(
        "SELECT * FROM Request WHERE request_id = ?",
        [id]
    );
    return rows[0];
};

// CREATE
exports.createRequest = async (data) => {
    const { nurse_id, request_type, title, description } = data;

    const [result] = await pool.query(
        `INSERT INTO Request (nurse_id, request_type, title, description, submission_date, current_status)
     VALUES (?, ?, ?, ?, CURDATE(), 'Pending')`,
        [nurse_id, request_type, title, description]
    );

    return result;
};

// UPDATE status
exports.updateRequestStatus = async (id, status) => {
    const [result] = await pool.query(
        "UPDATE Request SET current_status=? WHERE request_id=?",
        [status, id]
    );

    return result;
};

// DELETE
exports.deleteRequest = async (id) => {
    const [result] = await pool.query(
        "DELETE FROM Request WHERE request_id=?",
        [id]
    );

    return result;
};