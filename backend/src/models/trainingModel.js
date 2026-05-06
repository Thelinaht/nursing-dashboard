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

// GET Dashboard Data
exports.getDashboardData = async () => {
    // 1. Mandatory Trainings (Grid Format)
    const [rawTrainings] = await pool.query(`
        SELECT 
            st.nurse_id AS id,
            n.full_name AS name,
            tp.training_name AS course,
            st.status,
            DATE_FORMAT(st.expiry_date, '%M %d %Y') AS expiry
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        JOIN Nursing_staff n ON st.nurse_id = n.nurse_id
        WHERE tp.mandatory = 1
    `);

    const [rawCerts] = await pool.query(`
        SELECT 
            sc.nurse_id AS id,
            n.full_name AS name,
            ct.certificate_name AS course,
            sc.status,
            DATE_FORMAT(sc.expiry_date, '%M %d %Y') AS expiry
        FROM Staff_certificate sc
        JOIN Certificate_type ct ON sc.certificate_type_id = ct.certificate_type_id
        JOIN Nursing_staff n ON sc.nurse_id = n.nurse_id
        WHERE ct.certificate_name = 'Saudi Council'
    `);

    // Grouping by Nurse ID
    const nurseMap = {};

    [...rawTrainings, ...rawCerts].forEach(record => {
        if (!nurseMap[record.id]) {
            nurseMap[record.id] = {
                id: record.id,
                name: record.name,
                saudiCouncil: '-',
                bls: '-',
                fireSafety: '-',
                infectionControl: '-',
                medicationSafety: '-',
                biscl: '-',
                fms: '-',
                isFMSCheck: false,
                isRed: false // Can be logic to check if anything is overdue
            };
        }
        
        const n = nurseMap[record.id];
        
        // Check if anything is red (expired/overdue) for styling
        const isExpired = record.status === 'Expired' || record.status === 'Overdue';
        if (isExpired) n.isRed = true;

        if (record.course === 'Saudi Council') n.saudiCouncil = record.expiry;
        if (record.course === 'BLS') n.bls = record.expiry;
        if (record.course === 'Fire and Safety') n.fireSafety = record.expiry;
        if (record.course === 'Infection Control') n.infectionControl = record.expiry;
        if (record.course === 'Medication Safety Program') n.medicationSafety = record.expiry;
        if (record.course === 'BISCL') n.biscl = record.expiry;
        if (record.course === 'FMS') {
             n.fms = '✓'; // FMS is usually a checkmark
             n.isFMSCheck = true;
        }
    });

    const mandatoryTrainings = Object.values(nurseMap);

    // 2. Clinical Competencies
    const [clinicalCompetencies] = await pool.query(`
        SELECT 
            st.nurse_id AS id,
            n.full_name AS nurse,
            n.unit AS specialty,
            tp.training_name AS competency,
            st.status,
            DATE_FORMAT(st.expiry_date, '%Y-%m-%d') AS renewal,
            COALESCE(st.recommendation_action_plan, 'None') AS action
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        JOIN Nursing_staff n ON st.nurse_id = n.nurse_id
        WHERE tp.training_category = 'Competency'
    `);

    // 3. Certifications
    const [certTracker] = await pool.query(`
        SELECT 
            sc.certificate_number AS id,
            n.full_name AS nurseName,
            ct.certificate_name AS name,
            sc.certificate_number AS number,
            DATE_FORMAT(sc.expiry_date, '%Y-%m-%d') AS expiry,
            sc.status AS uploadStatus,
            95 AS compliance
        FROM Staff_certificate sc
        JOIN Certificate_type ct ON sc.certificate_type_id = ct.certificate_type_id
        JOIN Nursing_staff n ON sc.nurse_id = n.nurse_id
    `);

    // 4. Onboarding Data
    const [onboardingData] = await pool.query(`
        SELECT 
            n.nurse_id AS id,
            n.full_name AS name,
            n.job_title AS role,
            'Assigned Preceptor' AS preceptor,
            80 AS progress,
            'Pending' AS evalScore
        FROM Nursing_staff n
        WHERE n.hire_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `);

    // 5. Interns (Trainees)
    const [internRequests] = await pool.query(`
        SELECT 
            trainee_id AS id,
            full_name AS name,
            university,
            training_type AS program,
            'Active' AS status
        FROM Trainee
    `);

    const overdueCount = mandatoryTrainings.filter(m => m.isRed).length;
    const totalCount = mandatoryTrainings.length || 1; // avoid div by 0
    const complianceRate = Math.round(((totalCount - overdueCount) / totalCount) * 100);

    return {
        mandatoryTrainings,
        clinicalCompetencies,
        certTracker,
        onboardingData,
        internRequests,
        stats: {
            totalTrained: mandatoryTrainings.length || 0,
            compliance: complianceRate,
            expiring: certTracker.filter(c => c.uploadStatus === 'Expired' || new Date(c.expiry) < new Date(Date.now() + 30*24*60*60*1000)).length,
            overdue: overdueCount,
            interns: internRequests.length
        }
    };
};

// GET Trainees Directory
exports.getTrainees = async () => {
    const [rows] = await pool.query(`
        SELECT 
            trainee_id AS id,
            full_name AS name,
            university,
            training_type AS type,
            'Active' AS status,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate
        FROM Trainee
    `);
    return rows;
};