const db = require("../db");

async function getNurseProfileByUserId(userId) {
    const [rows] = await db.query(
        `
    SELECT
      ns.nurse_id,
      ns.user_id,
      ns.full_name,
      ns.first_name,
      ns.last_name,
      ns.national_id_iqama,
      ns.hospital_id_number,
      ns.gender,
      ns.nationality,
      ns.birth_date_gregorian,
      ns.mobile_number,
      ns.iau_email,
      ns.unit,
      ns.department,
      ns.job_title,
      ns.position_title,
      ns.license_number,
      ns.status,
      ns.hire_date,
      ns.years_of_experience,
      ns.shift_type
    FROM Nursing_staff ns
    WHERE ns.user_id = ?
    LIMIT 1
    `,
        [userId]
    );

    return rows[0] || null;
}

async function getUserAccountByUserId(userId) {
    const [rows] = await db.query(
        `
    SELECT
      user_id,
      email,
      account_status,
      created_at
    FROM User
    WHERE user_id = ?
    LIMIT 1
    `,
        [userId]
    );

    return rows[0] || null;
}

async function getLatestTrainingByUserId(userId, limit = 3) {
    const [rows] = await db.query(
        `
    SELECT
      st.nurse_id,
      st.training_id,
      st.start_date,
      st.completion_date,
      st.due_date,
      st.expiry_date,
      st.status,
      st.certificate_file_path,
      st.preceptor_name,
      st.recommendation_action_plan,
      tp.training_name,
      tp.training_category,
      tp.training_type,
      tp.duration_hours,
      tp.facility_name,
      tp.unit_of_training,
      tp.mandatory,
      tp.description
    FROM Staff_training st
    INNER JOIN Nursing_staff ns ON ns.nurse_id = st.nurse_id
    INNER JOIN Training_program tp ON tp.training_id = st.training_id
    WHERE ns.user_id = ?
    ORDER BY COALESCE(st.completion_date, st.due_date, st.start_date) DESC
    LIMIT ?
    `,
        [userId, Number(limit)]
    );

    return rows;
}

async function getLatestLicenseByUserId(userId) {
    const [rows] = await db.query(
        `
    SELECT
      sl.license_id,
      sl.nurse_id,
      sl.license_number,
      sl.issue_date,
      sl.expiry_date,
      sl.issuing_authority
    FROM Staff_license sl
    INNER JOIN Nursing_staff ns ON ns.nurse_id = sl.nurse_id
    WHERE ns.user_id = ?
    ORDER BY sl.expiry_date DESC
    LIMIT 1
    `,
        [userId]
    );

    return rows[0] || null;
}

async function getLatestRequestByUserId(userId) {
    const [rows] = await db.query(
        `
    SELECT
      r.request_id,
      r.nurse_id,
      r.request_type,
      r.title,
      r.description,
      r.submission_date,
      r.current_status,
      r.created_at
    FROM Request r
    INNER JOIN Nursing_staff ns ON ns.nurse_id = r.nurse_id
    WHERE ns.user_id = ?
    ORDER BY COALESCE(r.created_at, r.submission_date) DESC
    LIMIT 1
    `,
        [userId]
    );

    return rows[0] || null;
}

async function getUnreadNotificationsByUserId(userId) {
    const [rows] = await db.query(
        `
    SELECT COUNT(*) AS unreadCount
    FROM Notification
    WHERE user_id = ? AND is_read = 0
    `,
        [userId]
    );

    return rows[0]?.unreadCount || 0;
}

async function getLatestNotificationsByUserId(userId, limit = 3) {
    const [rows] = await db.query(
        `
    SELECT
      notification_id,
      title,
      message,
      notification_type,
      priority,
      category,
      created_at,
      is_read
    FROM Notification
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
    `,
        [userId, Number(limit)]
    );

    return rows;
}

module.exports = {
    getNurseProfileByUserId,
    getUserAccountByUserId,
    getLatestTrainingByUserId,
    getLatestLicenseByUserId,
    getLatestRequestByUserId,
    getUnreadNotificationsByUserId,
    getLatestNotificationsByUserId,
};