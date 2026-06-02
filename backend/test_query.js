require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log("Testing getAggregatedResults...");
        const [res1] = await pool.query(
            `SELECT
               sr.subscale,
               sr.item_index,
               ROUND(AVG(sr.score), 2)  AS avg_score,
               COUNT(sr.score)          AS response_count
             FROM survey_responses sr
             JOIN survey_submissions ss ON ss.submission_id = sr.submission_id
             JOIN survey_periods sp     ON sp.period_id     = ss.period_id
             WHERE sp.year        = 2026
               AND sp.survey_type = 'pes_nwi'
               AND ss.status      = 'completed'
             GROUP BY sr.subscale, sr.item_index
             ORDER BY sr.subscale, sr.item_index`
        );
        console.log("Res1:", res1.length, "rows");

        console.log("Testing getCompletionStats...");
        const [res2] = await pool.query(
            `SELECT
               COUNT(DISTINCT ss.user_id)                             AS completed_count,
               (SELECT COUNT(*) FROM User WHERE role_id != 4)         AS total_staff
             FROM survey_submissions ss
             JOIN survey_periods sp ON sp.period_id = ss.period_id
             WHERE sp.year        = 2026
               AND sp.survey_type = 'pes_nwi'
               AND ss.status      = 'completed'`
        );
        console.log("Res2:", res2);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}
run();
