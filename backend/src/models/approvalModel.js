const pool = require("../db");


exports.getAllApprovals = async () => {
    const [rows] = await pool.query("SELECT * FROM request_approval");
    return rows;
};




// إنشاء approval (Supervisor أول)
exports.createApproval = async (request_id, role) => {
    const [result] = await pool.query(
        `INSERT INTO request_approval 
        (request_id, approver_role, decision) 
        VALUES (?, ?, 'Pending')`,
        [request_id, role]
    );

    return result;
};

// تحديث القرار
exports.makeDecision = async (request_id, role, decision) => {
    const [result] = await pool.query(
        `UPDATE request_approval 
         SET decision=?, decision_date=NOW()
         WHERE request_id=? AND approver_role=?`,
        [decision, request_id, role]
    );

    return result;
};