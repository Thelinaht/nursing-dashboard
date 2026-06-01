const pool = require("../db");

exports.getAssignmentsByDate = async (date) => {
    const [rows] = await pool.query(`
        SELECT a.assignment_id, a.nurse_id, a.unit, a.shift, a.assignment_date, n.full_name
        FROM DailyAssignment a
        JOIN Nursing_staff n ON a.nurse_id = n.nurse_id
        WHERE a.assignment_date = ?
    `, [date]);
    return rows;
};

exports.getNursesAvailability = async (date) => {
    // Returns list of all nurses with their assigned status on a specific date
    const [rows] = await pool.query(`
        SELECT n.nurse_id, n.full_name, n.unit as home_unit, 
               a.assignment_id, a.unit as assigned_unit, a.shift as assigned_shift
        FROM Nursing_staff n
        LEFT JOIN DailyAssignment a ON n.nurse_id = a.nurse_id AND a.assignment_date = ?
    `, [date]);
    return rows;
};

exports.createOrUpdateAssignment = async (nurse_id, unit, shift, assignment_date) => {
    // Check if the assignment on this date already exists for the nurse
    const [existing] = await pool.query(`
        SELECT assignment_id FROM DailyAssignment 
        WHERE nurse_id = ? AND assignment_date = ?
    `, [nurse_id, assignment_date]);

    let result;
    if (existing.length > 0) {
        const assignment_id = existing[0].assignment_id;
        await pool.query(`
            UPDATE DailyAssignment 
            SET unit = ?, shift = ? 
            WHERE assignment_id = ?
        `, [unit, shift, assignment_id]);
        result = { assignment_id, nurse_id, unit, shift, assignment_date, action: 'updated' };
    } else {
        const [insertResult] = await pool.query(`
            INSERT INTO DailyAssignment (nurse_id, unit, shift, assignment_date) 
            VALUES (?, ?, ?, ?)
        `, [nurse_id, unit, shift, assignment_date]);
        result = { assignment_id: insertResult.insertId, nurse_id, unit, shift, assignment_date, action: 'created' };
    }

    // ── Update nurse's unit in Nursing_staff so the new supervisor can see them ──
    await pool.query(
        `UPDATE Nursing_staff SET unit = ? WHERE nurse_id = ?`,
        [unit, nurse_id]
    );

    return result;
};

exports.deleteAssignment = async (assignment_id) => {
    const [result] = await pool.query(`
        DELETE FROM DailyAssignment WHERE assignment_id = ?
    `, [assignment_id]);
    return result.affectedRows > 0;
};