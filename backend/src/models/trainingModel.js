const pool = require("../db");

// GET all training for nurse
exports.getByNurseId = async (nurseId) => {
    const [rows] = await pool.query(`
        SELECT 
            st.*, 
            tp.training_name
        FROM Staff_training st
        JOIN Training_program tp 
        ON st.training_id = tp.training_id
        WHERE st.nurse_id = ?
    `, [nurseId]);

    return rows;
};

// UPDATE
exports.updateTraining = async (nurseId, trainingId, data) => {
    const [result] = await pool.query(
        `UPDATE Staff_training SET ? 
         WHERE nurse_id = ? AND training_id = ?`,
        [data, nurseId, trainingId]
    );

    return result;
};