const pool = require("../db");

// GET all with nurse info + approval comments
exports.getAllRequests = async () => {
    const [rows] = await pool.query(
        `SELECT r.*, n.full_name, n.unit, n.user_id as nurse_user_id
         FROM Request r
         LEFT JOIN Nursing_staff n ON r.nurse_id = n.nurse_id
         ORDER BY r.created_at DESC`
    );
    return rows;
};

// GET all requests filtered by unit (for supervisor)
exports.getRequestsByUnit = async (unit) => {
    const [rows] = await pool.query(
        `SELECT r.*, n.full_name, n.unit, n.user_id as nurse_user_id
         FROM Request r
         LEFT JOIN Nursing_staff n ON r.nurse_id = n.nurse_id
         WHERE n.unit = ?
         ORDER BY r.created_at DESC`,
        [unit]
    );
    return rows;
};

// GET by nurse_id
exports.getRequestsByNurseId = async (nurseId) => {
    const [rows] = await pool.query(
        `SELECT r.*, n.full_name
         FROM Request r
         LEFT JOIN Nursing_staff n ON r.nurse_id = n.nurse_id
         WHERE r.nurse_id = ?
         ORDER BY r.created_at DESC`,
        [nurseId]
    );
    return rows;
};

// GET one with approvals trail
exports.getRequestById = async (id) => {
    const [rows] = await pool.query(
        `SELECT r.*, n.full_name, n.user_id as nurse_user_id
         FROM Request r
         LEFT JOIN Nursing_staff n ON r.nurse_id = n.nurse_id
         WHERE r.request_id = ?`,
        [id]
    );
    return rows[0];
};

// CREATE — starts at Pending_Supervisor
exports.createRequest = async (data) => {
    const { nurse_id, request_type, title, description } = data;
    const [result] = await pool.query(
        `INSERT INTO Request (nurse_id, request_type, title, description, submission_date, current_status)
         VALUES (?, ?, ?, ?, CURDATE(), 'Pending_Supervisor')`,
        [nurse_id, request_type, title, description]
    );
    return result;
};

// UPDATE status
exports.updateRequestStatus = async (id, status) => {
    const [result] = await pool.query(
        "UPDATE Request SET current_status = ? WHERE request_id = ?",
        [status, id]
    );
    return result;
};

// DELETE
exports.deleteRequest = async (id) => {
    const [result] = await pool.query("DELETE FROM Request WHERE request_id = ?", [id]);
    return result;
};