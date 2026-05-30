const pool = require("../db");

// Get all approvals for a request (full comment trail)
exports.getApprovalsByRequestId = async (request_id) => {
    const [rows] = await pool.query(
        `SELECT * FROM Request_approval WHERE request_id = ? ORDER BY approval_id ASC`,
        [request_id]
    );
    return rows;
};

exports.getAllApprovals = async () => {
    const [rows] = await pool.query("SELECT * FROM Request_approval ORDER BY approval_id DESC");
    return rows;
};

// Create the first approval row when a request is submitted
exports.createApproval = async (request_id, role) => {
    const [result] = await pool.query(
        `INSERT INTO Request_approval (request_id, approver_role, decision)
         VALUES (?, ?, 'Pending')`,
        [request_id, role]
    );
    return result;
};

// Record a decision with a comment
exports.makeDecision = async (request_id, role, decision, comment) => {
    const [result] = await pool.query(
        `UPDATE Request_approval
         SET decision = ?, notes = ?, decision_date = NOW()
         WHERE request_id = ? AND approver_role = ? AND decision = 'Pending'`,
        [decision, comment || null, request_id, role]
    );
    return result;
};