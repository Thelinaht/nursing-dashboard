const pool = require("../db");

// GET all training programs + nurse's record (if exists) using user_id
exports.getByUserId = async (userId) => {
    // First get nurse_id from user_id
    const [nurseRows] = await pool.query(
        "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?",
        [userId]
    );

    if (!nurseRows[0]) return [];
    const nurseId = nurseRows[0].nurse_id;

    // Get all programs + nurse's record via LEFT JOIN
    const [rows] = await pool.query(`
        SELECT 
            tp.training_id,
            tp.training_name,
            tp.training_category,
            tp.training_type,
            tp.duration_hours,
            tp.mandatory,
            st.nurse_id,
            st.start_date,
            st.completion_date,
            st.due_date,
            st.expiry_date,
            st.certificate_file_path,
            st.preceptor_name,
            st.recommendation_action_plan,
            COALESCE(st.status, 'Pending') AS status
        FROM Training_program tp
        LEFT JOIN Staff_training st 
            ON tp.training_id = st.training_id AND st.nurse_id = ?
        ORDER BY tp.mandatory DESC, tp.training_category, tp.training_name
    `, [nurseId]);

    return { rows, nurseId };
};

// UPDATE or INSERT a training record
exports.upsertTraining = async (nurseId, trainingId, data) => {
    // Try update first
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_training WHERE nurse_id = ? AND training_id = ?",
        [nurseId, trainingId]
    );

    if (existing.length > 0) {
        // UPDATE
        const allowed = [
            "start_date", "completion_date", "due_date", "expiry_date",
            "preceptor_name", "recommendation_action_plan", "status",
            "certificate_file_path"
        ];
        const filteredData = {};
        for (const field of allowed) {
            if (data[field] !== undefined) {
                filteredData[field] = data[field] === "" ? null : data[field];
            }
        }
        const [result] = await pool.query(
            "UPDATE Staff_training SET ? WHERE nurse_id = ? AND training_id = ?",
            [filteredData, nurseId, trainingId]
        );
        return result;
    } else {
        // INSERT
        const [result] = await pool.query(
            `INSERT INTO Staff_training 
             (nurse_id, training_id, start_date, completion_date, due_date, expiry_date, preceptor_name, recommendation_action_plan, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nurseId, trainingId,
                data.start_date || null,
                data.completion_date || null,
                data.due_date || null,
                data.expiry_date || null,
                data.preceptor_name || null,
                data.recommendation_action_plan || null,
                data.status || "Pending"
            ]
        );
        return result;
    }
};

// Upload certificate path
exports.updateCertificatePath = async (nurseId, trainingId, filePath) => {
    // Ensure row exists first
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_training WHERE nurse_id = ? AND training_id = ?",
        [nurseId, trainingId]
    );
    if (existing.length === 0) {
        await pool.query(
            "INSERT INTO Staff_training (nurse_id, training_id, status) VALUES (?, ?, 'Pending')",
            [nurseId, trainingId]
        );
    }
    await pool.query(
        "UPDATE Staff_training SET certificate_file_path = ? WHERE nurse_id = ? AND training_id = ?",
        [filePath, nurseId, trainingId]
    );
};