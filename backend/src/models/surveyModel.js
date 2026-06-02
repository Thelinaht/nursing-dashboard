const pool = require("../db");


const getPendingSurveys = async (userId) => {
    const [rows] = await pool.query(
        `SELECT
       sp.period_id,
       sp.year,
       sp.survey_type,
       sp.opens_at,
       sp.closes_at,
       COALESCE(ss.status, 'pending') AS status
     FROM survey_periods sp
     LEFT JOIN survey_submissions ss
       ON ss.period_id = sp.period_id AND ss.user_id = ?
     WHERE sp.is_active = TRUE
       AND CURDATE() BETWEEN sp.opens_at AND sp.closes_at
       AND (ss.status IS NULL OR ss.status = 'pending')
     ORDER BY sp.survey_type`,
        [userId]
    );
    return rows;
};

// -------------------------------------------------------
//  حفظ إجابات السيرفي
//  responses = [ { subscale, item_index, score }, ... ]
// -------------------------------------------------------
const submitSurvey = async (userId, periodId, responses) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // أنشئ أو جلب الـ submission
        const [existing] = await conn.query(
            `SELECT submission_id, status FROM survey_submissions
       WHERE user_id = ? AND period_id = ?`,
            [userId, periodId]
        );

        if (existing.length > 0 && existing[0].status === "completed") {
            await conn.rollback();
            conn.release();
            return { alreadySubmitted: true };
        }

        let submissionId;

        if (existing.length === 0) {
            const [ins] = await conn.query(
                `INSERT INTO survey_submissions (user_id, period_id, status)
         VALUES (?, ?, 'pending')`,
                [userId, periodId]
            );
            submissionId = ins.insertId;
        } else {
            submissionId = existing[0].submission_id;
            await conn.query(
                `DELETE FROM survey_responses WHERE submission_id = ?`,
                [submissionId]
            );
        }

        if (responses.length > 0) {
            const values = responses.map((r) => [
                submissionId,
                r.subscale,
                r.item_index,
                r.score,
            ]);
            await conn.query(
                `INSERT INTO survey_responses (submission_id, subscale, item_index, score)
         VALUES ?`,
                [values]
            );
        }

        await conn.query(
            `UPDATE survey_submissions
       SET status = 'completed', submitted_at = NOW()
       WHERE submission_id = ?`,
            [submissionId]
        );

        await conn.commit();
        conn.release();
        return { success: true, submissionId };
    } catch (err) {
        await conn.rollback();
        conn.release();
        throw err;
    }
};

const getAggregatedResults = async (year, surveyType) => {
    const [rows] = await pool.query(
        `SELECT
       sr.subscale,
       sr.item_index,
       ROUND(AVG(sr.score), 2)  AS avg_score,
       COUNT(sr.score)          AS response_count
     FROM survey_responses sr
     JOIN survey_submissions ss ON ss.submission_id = sr.submission_id
     JOIN survey_periods sp     ON sp.period_id     = ss.period_id
     WHERE sp.year        = ?
       AND sp.survey_type = ?
       AND ss.status      = 'completed'
     GROUP BY sr.subscale, sr.item_index
     ORDER BY sr.subscale, sr.item_index`,
        [year, surveyType]
    );
    return rows;
};


const getCompletionStats = async (year, surveyType) => {
    const [rows] = await pool.query(
        `SELECT
       COUNT(DISTINCT ss.user_id)                             AS completed_count,
       (SELECT COUNT(*) FROM User WHERE role_id != 4)         AS total_staff
     FROM survey_submissions ss
     JOIN survey_periods sp ON sp.period_id = ss.period_id
     WHERE sp.year        = ?
       AND sp.survey_type = ?
       AND ss.status      = 'completed'`,
        [year, surveyType]
    );
    return rows[0];
};

module.exports = {
    getPendingSurveys,
    submitSurvey,
    getAggregatedResults,
    getCompletionStats,
};