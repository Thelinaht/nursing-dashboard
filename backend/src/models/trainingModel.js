const pool = require("../db");

const unitMatches = (recordUnit, dbUnit) => {
    if (!recordUnit || !dbUnit) return false;
    const rU = recordUnit.toLowerCase().trim();
    const dU = dbUnit.toLowerCase().trim();
    if (rU === dU) return true;
    
    if (dU.startsWith(rU + " ") || dU.startsWith(rU + "(") || dU.includes("(" + rU + ")")) return true;
    if (rU.startsWith(dU + " ") || rU.startsWith(dU + "(") || rU.includes("(" + dU + ")")) return true;
    
    // Special cases
    if (rU === 'emergency' && dU.includes('emergency')) return true;
    if (rU === 'ccu' && dU.includes('coronary care unit')) return true;
    if (dU === 'ccu' && rU.includes('coronary care unit')) return true;
    
    return false;
};

// GET all training programs + trainee's record (if exists) using user_id
exports.getByUserId = async (userId) => {
    // First get trainee_id from user_id
    const [traineeRows] = await pool.query(
        "SELECT trainee_id FROM Trainee WHERE user_id = ?",
        [userId]
    );

    if (!traineeRows[0]) return { rows: [], traineeId: null };
    const traineeId = traineeRows[0].trainee_id;

    // Get all programs + trainee's record via LEFT JOIN
    const [rows] = await pool.query(`
        SELECT 
            tp.training_id,
            tp.training_name,
            tp.training_category,
            tp.training_type,
            tp.duration_hours,
            tp.mandatory,
            st.trainee_id,
            st.start_date,
            st.completion_date,
            st.due_date,
            st.expiry_date,
            st.certificate_file_path,
            st.preceptor_name,
            st.recommendation_action_plan,
            CASE
                WHEN st.status = 'Completed' AND st.expiry_date < CURDATE() THEN 'Expired'
                WHEN (st.status = 'Pending' OR st.status = 'In Progress' OR st.status IS NULL) 
                     AND st.due_date IS NOT NULL AND st.due_date < CURDATE() THEN 'Overdue'
                ELSE COALESCE(st.status, 'Pending')
            END AS status
        FROM Training_program tp
        LEFT JOIN Staff_training st 
            ON tp.training_id = st.training_id AND st.trainee_id = ?
        ORDER BY tp.mandatory DESC, tp.training_category, tp.training_name
    `, [traineeId]);

    return { rows, traineeId };
};

// UPDATE or INSERT a training record
exports.upsertTraining = async (traineeId, trainingId, data) => {
    // Try update first
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_training WHERE trainee_id = ? AND training_id = ?",
        [traineeId, trainingId]
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
            "UPDATE Staff_training SET ? WHERE trainee_id = ? AND training_id = ?",
            [filteredData, traineeId, trainingId]
        );
        return result;
    } else {
        // INSERT
        const [result] = await pool.query(
            `INSERT INTO Staff_training 
             (trainee_id, training_id, start_date, completion_date, due_date, expiry_date, preceptor_name, recommendation_action_plan, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                traineeId, trainingId,
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
exports.updateCertificatePath = async (traineeId, trainingId, filePath) => {
    // Ensure row exists first
    const [existing] = await pool.query(
        "SELECT 1 FROM Staff_training WHERE trainee_id = ? AND training_id = ?",
        [traineeId, trainingId]
    );
    if (existing.length === 0) {
        await pool.query(
            "INSERT INTO Staff_training (trainee_id, training_id, status) VALUES (?, ?, 'Pending')",
            [traineeId, trainingId]
        );
    }
    await pool.query(
        "UPDATE Staff_training SET certificate_file_path = ? WHERE trainee_id = ? AND training_id = ?",
        [filePath, traineeId, trainingId]
    );
};

// GET Dashboard Data
exports.getDashboardData = async () => {
    // 0. Get all Trainees to pre-populate
    const [allTrainees] = await pool.query("SELECT trainee_id AS id, full_name AS name FROM Trainee");

    // 1. Mandatory Trainings (Grid Format)
    const [rawTrainings] = await pool.query(`
        SELECT 
            st.trainee_id AS id,
            t.full_name AS name,
            tp.training_name AS course,
            st.status,
            DATE_FORMAT(st.expiry_date, '%M %d %Y') AS expiry
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        JOIN Trainee t ON st.trainee_id = t.trainee_id
        WHERE tp.mandatory = 1
    `);

    const [rawCerts] = await pool.query(`
        SELECT 
            sc.trainee_id AS id,
            t.full_name AS name,
            ct.certificate_name AS course,
            sc.status,
            DATE_FORMAT(sc.expiry_date, '%M %d %Y') AS expiry
        FROM Staff_certificate sc
        JOIN Certificate_type ct ON sc.certificate_type_id = ct.certificate_type_id
        JOIN Trainee t ON sc.trainee_id = t.trainee_id
        WHERE ct.certificate_name = 'Saudi Council'
    `);

    // Grouping by Trainee ID
    const traineeMap = {};

    // Pre-populate all trainees so they show in the table and dropdown even without records
    allTrainees.forEach(t => {
        traineeMap[t.id] = {
            id: t.id,
            name: t.name,
            saudiCouncil: '-',
            bls: '-',
            fireSafety: '-',
            infectionControl: '-',
            medicationSafety: '-',
            biscl: '-',
            fms: '-',
            isFMSCheck: false,
            isRed: false
        };
    });

    [...rawTrainings, ...rawCerts].forEach(record => {
        if (!traineeMap[record.id]) {
            traineeMap[record.id] = {
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
                isRed: false
            };
        }

        const n = traineeMap[record.id];

        // Check if anything is red (expired/overdue) for styling
        const isExpired = record.status === 'Expired' || record.status === 'Overdue';
        if (isExpired) n.isRed = true;

        if (record.course === 'Saudi Council') n.saudiCouncil = record.expiry || '-';
        if (record.course === 'BLS') n.bls = record.expiry || '-';
        if (record.course === 'Fire and Safety') n.fireSafety = record.expiry || '-';
        if (record.course === 'Infection Control') n.infectionControl = record.expiry || '-';
        if (record.course === 'Medication Safety Program') n.medicationSafety = record.expiry || '-';
        if (record.course === 'BISCL') n.biscl = record.expiry || '-';
        if (record.course === 'FMS') {
            n.fms = '✓';
            n.isFMSCheck = true;
        }
    });

    const mandatoryTrainings = Object.values(traineeMap);

    // 2. Clinical Competencies
    const [clinicalCompetencies] = await pool.query(`
        SELECT 
            st.trainee_id AS id,
            st.training_id,
            t.full_name AS nurse,
            t.unit AS specialty,
            tp.training_name AS competency,
            st.status,
            DATE_FORMAT(st.expiry_date, '%Y-%m-%d') AS renewal,
            COALESCE(st.recommendation_action_plan, 'None') AS action,
            st.pre_test_score,
            st.post_test_score
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        JOIN Trainee t ON st.trainee_id = t.trainee_id
        WHERE tp.training_category = 'Competency'
    `);

    // 3. Certifications
    const [certTracker] = await pool.query(`
        SELECT 
            clt.tracking_id AS id,
            t.full_name AS traineeName,
            COALESCE(t.unit, 'Unassigned') AS unit,
            clt.cert_name AS name,
            clt.cert_number AS number,
            DATE_FORMAT(clt.expiry_date, '%Y-%m-%d') AS expiry,
            clt.status AS uploadStatus,
            clt.compliance_percentage AS compliance,
            clt.scope
        FROM Certification_License_Tracking clt
        LEFT JOIN Trainee t ON clt.trainee_id = t.trainee_id
    `);

    // 4. Onboarding Data
    const [onboardingData] = await pool.query(`
        SELECT 
            t.trainee_id AS id,
            t.full_name AS name,
            t.training_type AS role,
            COALESCE(t.onboarding_preceptor, 'Assigned Preceptor') AS preceptor,
            COALESCE(t.onboarding_progress, 80) AS progress,
            COALESCE(t.onboarding_eval_score, 'Pending') AS evalScore
        FROM Trainee t
        WHERE t.start_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `);

    // 5. Interns (Trainees)
    const [internRequests] = await pool.query(`
        SELECT 
            trainee_id AS id,
            full_name AS name,
            university,
            training_type AS program,
            unit,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate,
            COALESCE(status, 'Active') AS status
        FROM Trainee
    `);

    const [programs] = await pool.query("SELECT training_id, training_name, training_category, duration_hours FROM Training_program");

    // 7. Staff Participation & Attendance stats calculated strictly from database
    const [huRows] = await pool.query("SELECT unit_name FROM Hospital_unit ORDER BY unit_name ASC");
    const dbUnits = huRows.map(r => r.unit_name);
    const hospitalUnits = dbUnits;

    const [rawParticipation] = await pool.query(`
        SELECT 
            st.training_id,
            tp.training_name AS courseName,
            tp.duration_hours,
            st.status,
            COALESCE(t.unit, ns.unit, 'General') AS unit
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        LEFT JOIN Trainee t ON st.trainee_id = t.trainee_id
        LEFT JOIN Nursing_staff ns ON st.nurse_id = ns.nurse_id
    `);

    const participationMap = {};
    programs.forEach(p => {
        participationMap[p.training_name] = {
            courseName: p.training_name,
            duration: parseFloat(p.duration_hours || 0),
            records: []
        };
    });

    rawParticipation.forEach(row => {
        if (participationMap[row.courseName]) {
            participationMap[row.courseName].records.push(row);
        }
    });

    const participationStats = {};
    const top5Units = ["ICU", "ER", "OR", "NICU", "Pediatrics"];
    const allPossibleUnits = [...new Set([...top5Units, ...dbUnits])];

    for (const [courseName, data] of Object.entries(participationMap)) {
        const records = data.records;
        const duration = data.duration || 4.0;
        const total = records.length;
        
        const noShowRecords = records.filter(r => r.status === "Pending" || r.status === "Overdue");
        const completedRecords = records.filter(r => r.status === "Completed");

        // Overall no-show rate
        let overallNoShowRate = 0;
        if (total > 0) {
            overallNoShowRate = Math.round((noShowRecords.length / total) * 1000) / 10;
        }

        // Avg training hours/staff
        let avgHrsPerStaff = 0;
        if (total > 0 && completedRecords.length > 0) {
            avgHrsPerStaff = Math.round(((completedRecords.length * duration) / total) * 10) / 10;
        }

        // Calculate rate per unit
        const unitData = [];
        allPossibleUnits.forEach(unit => {
            const unitRecords = records.filter(r => unitMatches(r.unit, unit));
            if (unitRecords.length > 0) {
                const unitNoShow = unitRecords.filter(r => r.status === "Pending" || r.status === "Overdue");
                unitData.push({
                    unit,
                    rate: Math.round((unitNoShow.length / unitRecords.length) * 1000) / 10
                });
            } else {
                unitData.push({
                    unit,
                    rate: 0.0
                });
            }
        });

        participationStats[courseName] = {
            overallNoShowRate,
            avgHrsPerStaff,
            unitData
        };
    }

    // 6. Certs/Training count by Unit + Certificate Name (for the bar chart)
    const [certsByUnit] = await pool.query(`
        SELECT
            COALESCE(t.unit, 'Unassigned') AS unit,
            clt.cert_name AS certName,
            COUNT(DISTINCT clt.trainee_id) AS count
        FROM Certification_License_Tracking clt
        JOIN Trainee t ON clt.trainee_id = t.trainee_id
        WHERE clt.cert_name IS NOT NULL AND t.unit IS NOT NULL
        GROUP BY t.unit, clt.cert_name
        UNION ALL
        SELECT
            COALESCE(t.unit, 'Unassigned') AS unit,
            tp.training_name AS certName,
            COUNT(DISTINCT st.trainee_id) AS count
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        JOIN Trainee t ON st.trainee_id = t.trainee_id
        WHERE tp.training_name IS NOT NULL AND t.unit IS NOT NULL
        GROUP BY t.unit, tp.training_name
    `);

    const overdueCount = mandatoryTrainings.filter(m => m.isRed).length;
    const totalCount = mandatoryTrainings.length || 1;
    const complianceRate = Math.round(((totalCount - overdueCount) / totalCount) * 100);

    // --- Training Needs Analysis Calculations ---
    const unitGapsMap = {};
    dbUnits.forEach(unit => {
        unitGapsMap[unit] = { total: 0, nonCompleted: 0 };
    });

    clinicalCompetencies.forEach(c => {
        const unit = c.specialty || 'General';
        if (!unitGapsMap[unit]) {
            unitGapsMap[unit] = { total: 0, nonCompleted: 0 };
        }
        unitGapsMap[unit].total += 1;
        if (c.status !== 'Completed') {
            unitGapsMap[unit].nonCompleted += 1;
        }
    });

    const competencyGaps = Object.entries(unitGapsMap).map(([unit, stats]) => {
        let gapPercent = 0;
        if (stats.total > 0) {
            gapPercent = Math.round((stats.nonCompleted / stats.total) * 100);
        }
        
        let gapLevel = "Low Gap";
        let color = "#4caf50"; // Green
        if (gapPercent >= 50) {
            gapLevel = "High Gap";
            color = "#e53935"; // Red
        } else if (gapPercent >= 15) {
            gapLevel = "Med Gap";
            color = "#ff9800"; // Orange
        }

        return {
            unit,
            gapPercent,
            gapLevel,
            color,
            total: stats.total,
            nonCompleted: stats.nonCompleted
        };
    }).sort((a, b) => b.gapPercent - a.gapPercent);

    // Calculate CPD hours completed vs required
    const [cpdRows] = await pool.query(`
        SELECT 
            SUM(CASE WHEN st.status = 'Completed' THEN tp.duration_hours ELSE 0 END) AS completed,
            SUM(tp.duration_hours) AS total
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
    `);
    const cpdCompleted = Math.round(parseFloat(cpdRows[0]?.completed || 0));
    const cpdRequired = Math.round(parseFloat(cpdRows[0]?.total || 0)) || 100; // fallback to prevent division by zero

    // New Hires (Missing Basics) count
    const [newHiresRows] = await pool.query(`
        SELECT COUNT(DISTINCT t.trainee_id) AS count
        FROM Trainee t
        JOIN Staff_training st ON t.trainee_id = st.trainee_id
        JOIN Training_program tp ON st.training_id = tp.training_id
        WHERE t.start_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          AND tp.mandatory = 1
          AND st.status IN ('Pending', 'Overdue', 'In Progress')
     `);
    const newHiresMissingBasics = newHiresRows[0]?.count || 0;

    // Unverified Float Staff count (Trainees with Pending status or unverified licenses)
    const [floatRows] = await pool.query(`
        SELECT COUNT(*) AS count 
        FROM Trainee 
        WHERE status = 'Pending' OR unit = 'Float Pool' OR unit = 'Float'
    `);
    const [pendingCerts] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM Certification_License_Tracking
        WHERE status = 'Pending'
    `);
    const unverifiedFloatStaff = (floatRows[0]?.count || 0) + (pendingCerts[0]?.count || 0);

    const [learningOutcomes] = await pool.query(`
        SELECT 
            tp.training_name AS course,
            ROUND(AVG(st.pre_test_score)) AS preTest,
            ROUND(AVG(st.post_test_score)) AS postTest
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        WHERE st.pre_test_score IS NOT NULL OR st.post_test_score IS NOT NULL
        GROUP BY tp.training_name
        ORDER BY tp.training_name
    `);

    const [allTestScores] = await pool.query(`
        SELECT 
            st.trainee_id AS traineeId,
            st.nurse_id AS nurseId,
            COALESCE(t.full_name, ns.full_name, 'Unknown Staff') AS nurse,
            COALESCE(t.unit, ns.unit, 'General') AS specialty,
            tp.training_name AS course,
            st.pre_test_score AS preTest,
            st.post_test_score AS postTest,
            st.status
        FROM Staff_training st
        JOIN Training_program tp ON st.training_id = tp.training_id
        LEFT JOIN Trainee t ON st.trainee_id = t.trainee_id
        LEFT JOIN Nursing_staff ns ON st.nurse_id = ns.nurse_id
        WHERE st.pre_test_score IS NOT NULL OR st.post_test_score IS NOT NULL
        ORDER BY COALESCE(t.full_name, ns.full_name), tp.training_name
    `);

    const [programItems] = await pool.query("SELECT id, category, title, location_provider AS locationProvider, duration, cost_or_status AS costOrStatus FROM Training_Program_Item ORDER BY id DESC");

    return {
        mandatoryTrainings,
        clinicalCompetencies,
        certTracker,
        allTestScores,
        onboardingData,
        internRequests,
        programs,
        certsByUnit,
        participationStats,
        hospitalUnits,
        learningOutcomes,
        programItems,
        needsAnalysis: {
            competencyGaps,
            cpdCompleted,
            cpdRequired,
            newHiresMissingBasics,
            unverifiedFloatStaff
        },
        stats: {
            totalTrained: mandatoryTrainings.length || 0,
            compliance: complianceRate,
            expiring: certTracker.filter(c => c.uploadStatus === 'Expired' || new Date(c.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
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
            COALESCE(status, 'Active') AS status,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate,
            unit
        FROM Trainee
    `);
    return rows;
};

// UPDATE dashboard rows dynamically
exports.updateDashboardRow = async (type, id, fields) => {
    if (type === "mandatory") {
        for (const [courseName, value] of Object.entries(fields)) {
            if (courseName === "Saudi Council") {
                const [existing] = await pool.query(
                    "SELECT 1 FROM Staff_certificate WHERE trainee_id = ? AND certificate_type_id = 1",
                    [id]
                );
                if (existing.length > 0) {
                    await pool.query(
                        "UPDATE Staff_certificate SET expiry_date = ?, status = ? WHERE trainee_id = ? AND certificate_type_id = 1",
                        [value.expiry_date || null, value.status || "Valid", id]
                    );
                } else {
                    await pool.query(
                        "INSERT INTO Staff_certificate (trainee_id, certificate_type_id, expiry_date, status, issue_date) VALUES (?, 1, ?, ?, CURDATE())",
                        [id, value.expiry_date || null, value.status || "Valid"]
                    );
                }
            } else {
                const [prog] = await pool.query("SELECT training_id FROM Training_program WHERE training_name = ?", [courseName]);
                if (prog[0]) {
                    const trainingId = prog[0].training_id;
                    let dbStatus = value.status || "Pending";
                    if (dbStatus === "✓") dbStatus = "Completed";
                    if (dbStatus === "—") dbStatus = "Pending";

                    const [existing] = await pool.query(
                        "SELECT 1 FROM Staff_training WHERE trainee_id = ? AND training_id = ?",
                        [id, trainingId]
                    );
                    if (existing.length > 0) {
                        await pool.query(
                            "UPDATE Staff_training SET expiry_date = ?, status = ? WHERE trainee_id = ? AND training_id = ?",
                            [value.expiry_date || null, dbStatus, id, trainingId]
                        );
                    } else {
                        await pool.query(
                            "INSERT INTO Staff_training (trainee_id, training_id, expiry_date, status) VALUES (?, ?, ?, ?)",
                            [id, trainingId, value.expiry_date || null, dbStatus]
                        );
                    }
                }
            }
        }
        return { success: true };
    } else if (type === "competency") {
        const { status, renewal, action, training_id, pre_test_score, post_test_score } = fields;
        const [existing] = await pool.query(
            "SELECT 1 FROM Staff_training WHERE trainee_id = ? AND training_id = ?",
            [id, training_id]
        );
        if (existing.length > 0) {
            await pool.query(
                "UPDATE Staff_training SET status = ?, expiry_date = ?, recommendation_action_plan = ?, pre_test_score = ?, post_test_score = ? WHERE trainee_id = ? AND training_id = ?",
                [status, renewal || null, action || null, pre_test_score !== undefined ? pre_test_score : null, post_test_score !== undefined ? post_test_score : null, id, training_id]
            );
        } else {
            await pool.query(
                "INSERT INTO Staff_training (trainee_id, training_id, status, expiry_date, recommendation_action_plan, pre_test_score, post_test_score) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [id, training_id, status, renewal || null, action || null, pre_test_score !== undefined ? pre_test_score : null, post_test_score !== undefined ? post_test_score : null]
            );
        }
        return { success: true };
    } else if (type === "certification") {
        const { trainee_id, name, number, expiry, compliance, uploadStatus, scope } = fields;
        if (id === "new") {
            await pool.query(
                `INSERT INTO Certification_License_Tracking (trainee_id, cert_name, cert_number, expiry_date, compliance_percentage, status, scope, certificate_type_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [trainee_id, name, number, expiry || null, compliance, uploadStatus, scope || 'General']
            );
        } else {
            await pool.query(
                `UPDATE Certification_License_Tracking 
                 SET cert_name = ?, cert_number = ?, expiry_date = ?, compliance_percentage = ?, status = ?, scope = ? 
                 WHERE tracking_id = ?`,
                 [name, number, expiry || null, compliance, uploadStatus, scope || 'General', id]
            );
        }
        return { success: true };
    } else if (type === "onboarding") {
        const { role, preceptor, progress, evalScore } = fields;
        await pool.query(
            `UPDATE Trainee 
             SET training_type = ?, onboarding_preceptor = ?, onboarding_progress = ?, onboarding_eval_score = ? 
             WHERE trainee_id = ?`,
            [role, preceptor, progress, evalScore, id]
        );
        return { success: true };
    } else if (type === "intern") {
        const { name, university, program, status, unit, start_date, end_date } = fields;
        if (id === "new") {
            await pool.query(
                `INSERT INTO Trainee (full_name, university, training_type, unit, start_date, end_date, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    name,
                    university,
                    program,
                    unit || null,
                    start_date || new Date().toISOString().split("T")[0],
                    end_date || null,
                    status
                ]
            );
        } else {
            await pool.query(
                `UPDATE Trainee 
                 SET full_name = ?, university = ?, training_type = ?, unit = ?, start_date = ?, end_date = ?, status = ? 
                 WHERE trainee_id = ?`,
                [name, university, program, unit || null, start_date || null, end_date || null, status, id]
            );
        }
        return { success: true };
    } else if (type === "program_item") {
        const { category, title, locationProvider, duration, costOrStatus } = fields;
        if (id === "new") {
            await pool.query(
                `INSERT INTO Training_Program_Item (category, title, location_provider, duration, cost_or_status)
                 VALUES (?, ?, ?, ?, ?)`,
                [category, title, locationProvider || null, duration || null, costOrStatus || null]
            );
        } else {
            await pool.query(
                `UPDATE Training_Program_Item 
                 SET category = ?, title = ?, location_provider = ?, duration = ?, cost_or_status = ? 
                 WHERE id = ?`,
                [category, title, locationProvider || null, duration || null, costOrStatus || null, id]
            );
        }
        return { success: true };
    }
    throw new Error("Unknown update type");
};

// DELETE program item
exports.deleteProgramItem = async (id) => {
    await pool.query("DELETE FROM Training_Program_Item WHERE id = ?", [id]);
    return { success: true };
};

// GET all units from Hospital_unit
exports.getHospitalUnits = async () => {
    const [rows] = await pool.query("SELECT unit_id, unit_name, category, description FROM Hospital_unit ORDER BY unit_name ASC");
    return rows;
};