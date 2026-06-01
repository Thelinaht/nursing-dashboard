const pool = require("../db");

// Helper to robustly extract patients number from ratio strings (like 1:3, 1*3, 1-3, 1/3, or just 3)
const parseRatioPatients = (ratioStr) => {
    if (!ratioStr) return 0;
    const match = ratioStr.match(/1\s*[^\d\s]?\s*(\d+)/) || ratioStr.match(/(\d+)/);
    if (match) {
        return parseInt(match[1] || match[0], 10) || 0;
    }
    return 0;
};


exports.getDirectorKPIs = async (req, res) => {
    try {
        // 1. Total Nursing Staff
        const [[{ total_nursing_staff }]] = await pool.query(
            `SELECT COUNT(*) AS total_nursing_staff FROM Nursing_staff`
        );

        // 2. New Orientees
        // Since there is no "status" in Staff_orientation based on schema, we just count them.
        const [[{ new_orientees }]] = await pool.query(
            `SELECT COUNT(DISTINCT nurse_id) AS new_orientees FROM Staff_orientation`
        );

        // 3. Licenses Expiring in 30 days
        const [[{ expiring_licenses }]] = await pool.query(
            `SELECT COUNT(*) AS expiring_licenses FROM Staff_license 
             WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
        );

        // 4. Expired Certificates
        const [[{ expired_certs }]] = await pool.query(
            `SELECT COUNT(*) AS expired_certs FROM Staff_certificate WHERE expiry_date < CURDATE()`
        );

        // 5. Training Compliance
        const [[{ compliance_rate }]] = await pool.query(
            `SELECT 
                IFNULL(
                    ROUND((SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100), 
                0) AS compliance_rate 
             FROM Staff_training`
        );

        res.json({
            total_nursing_staff: total_nursing_staff || 0,
            new_orientees: new_orientees || 0,
            expiring_licenses: expiring_licenses || 0,
            expired_certs: expired_certs || 0,
            training_compliance: compliance_rate || 0
        });
    } catch (error) {
        console.error("Error fetching Director KPIs:", error);
        res.status(500).json({ error: "Failed to fetch KPIs" });
    }
};

exports.getInpatientStaffing = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                u.unit_name, 
                u.bed_census, 
                u.required_ratio, 
                u.total_needed,
                COUNT(n.nurse_id) AS available_nurses
             FROM Unit_staffing_reference u
             LEFT JOIN Nursing_staff n ON u.unit_name = n.unit
             WHERE u.unit_type = 'In-patient'
             GROUP BY u.unit_id`
        );

        const staffingData = rows.map(row => {
            const gap = row.available_nurses - row.total_needed;
            let status = 'Critical';
            let percentage = row.total_needed > 0 ? (row.available_nurses / row.total_needed) * 100 : 100;

            if (percentage >= 90) status = 'OK';
            else if (percentage >= 60) status = 'Partial';

            return {
                ...row,
                gap,
                status
            };
        });

        res.json(staffingData);
    } catch (error) {
        console.error("Error fetching inpatient staffing:", error);
        res.status(500).json({ error: "Failed to fetch inpatient staffing" });
    }
};

exports.getAmbulatoryStaffing = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                u.unit_name, 
                u.bed_census, 
                u.required_ratio, 
                u.total_needed,
                COUNT(n.nurse_id) AS available_nurses
             FROM Unit_staffing_reference u
             LEFT JOIN Nursing_staff n ON u.unit_name = n.unit
             WHERE u.unit_type = 'Ambulatory'
             GROUP BY u.unit_id`
        );

        const staffingData = rows.map(row => {
            const gap = row.available_nurses - row.total_needed;
            let status = 'Critical';
            let percentage = row.total_needed > 0 ? (row.available_nurses / row.total_needed) * 100 : 100;

            if (percentage >= 90) status = 'OK';
            else if (percentage >= 60) status = 'Partial';

            return {
                ...row,
                gap,
                status
            };
        });

        res.json(staffingData);
    } catch (error) {
        console.error("Error fetching ambulatory staffing:", error);
        res.status(500).json({ error: "Failed to fetch ambulatory staffing" });
    }
};

exports.getRatioLogs = async (req, res) => {
    try {
        const { filter, unit } = req.query; // 'Today', 'This Week', 'All' + optional unit

        let dateFilter = '1=1';
        if (filter === 'Today') {
            dateFilter = 'DATE(rl.created_at) = CURDATE()';
        } else if (filter === 'This Week') {
            dateFilter = 'YEARWEEK(rl.created_at, 1) = YEARWEEK(CURDATE(), 1)';
        }

        // Add unit filter if provided
        const unitFilter = unit ? `AND rl.unit = ?` : '';
        const params = unit ? [unit] : [];

        const [rows] = await pool.query(`
            SELECT 
                rl.id,
                rl.unit as unit_name,
                COALESCE(usr.required_ratio, rl.required_ratio) as required_ratio,
                rl.logged_ratio,
                rl.shift,
                rl.notes,
                rl.created_at as timestamp,
                ns.full_name as logged_by_name
            FROM ratio_logs rl
            LEFT JOIN User u ON rl.logged_by = u.user_id
            LEFT JOIN Nursing_staff ns ON u.user_id = ns.user_id
            LEFT JOIN Unit_staffing_reference usr ON rl.unit = usr.unit_name
            WHERE ${dateFilter} ${unitFilter}
            ORDER BY rl.created_at DESC
            LIMIT 100
        `, params);

        // Recalculate status dynamically using the CURRENT required_ratio
        const processedRows = rows.map(row => {
            const loggedPatients = parseRatioPatients(row.logged_ratio);
            const requiredPatients = parseRatioPatients(row.required_ratio);
            const diff = loggedPatients - requiredPatients;
            let status = 'Compliant';
            if (diff === 1) status = 'Borderline';
            else if (diff > 1) status = 'Breached';
            return { ...row, status };
        });

        res.json(processedRows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch ratio logs" });
    }
};


exports.addRatioLog = async (req, res) => {
    try {
        const { unit, shift, actual_ratio, notes, logged_by, timestamp } = req.body;

        // Fetch required ratio
        const [ref] = await pool.query('SELECT required_ratio FROM Unit_staffing_reference WHERE unit_name = ?', [unit]);
        let required_ratio = '1:3'; // default fallback
        if (ref.length > 0 && ref[0].required_ratio) {
            required_ratio = ref[0].required_ratio;
        }



        // Calculate status
        let status = 'Compliant';
        const loggedPatients = parseRatioPatients(actual_ratio);
        const requiredPatients = parseRatioPatients(required_ratio);
        const diff = loggedPatients - requiredPatients;
        if (diff === 1) status = 'Borderline';
        else if (diff > 1) status = 'Breached';

        const recordTimestamp = timestamp ? new Date(timestamp) : new Date();

        await pool.query(
            'INSERT INTO ratio_logs (unit, required_ratio, logged_ratio, shift, notes, logged_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [unit, required_ratio, actual_ratio, shift, notes || '', logged_by || 1, status, recordTimestamp]
        );

        // Insert notification
        const notificationMessage = `A new ratio of ${actual_ratio} has been logged for unit ${unit} during the ${shift} shift. Status: ${status}.`;
        await pool.query(
            "INSERT INTO Notification (user_id, title, message, notification_type, priority, category) VALUES (?, ?, ?, ?, ?, ?)",
            [logged_by || 1, 'Nurse-to-Patient Ratio Logged', notificationMessage, status === 'Compliant' ? 'success' : status === 'Borderline' ? 'warning' : 'error', 'medium', 'Ratio Log']
        );

        // Emit real-time event so Director Dashboard refreshes immediately
        const io = req.app.get("io");
        if (io) {
            io.emit("ratio_log_updated", { unit, status });
        }

        res.json({ message: "Log added successfully", status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add ratio log" });
    }
};

exports.updateRequiredRatio = async (req, res) => {
    try {
        const { unit, required_ratio } = req.body;
        if (!unit || !required_ratio) {
            return res.status(400).json({ error: "unit and required_ratio are required" });
        }

        // Update in Unit_staffing_reference (upsert-style: update if exists)
        const [result] = await pool.query(
            `UPDATE Unit_staffing_reference SET required_ratio = ? WHERE unit_name = ?`,
            [required_ratio, unit]
        );

        // If no row matched, insert a minimal reference row
        if (result.affectedRows === 0) {
            await pool.query(
                `INSERT INTO Unit_staffing_reference (unit_name, required_ratio, unit_type, bed_census, nurses_needed_day, nurses_needed_night, total_needed) VALUES (?, ?, 'In-patient', 0, 0, 0, 0)`,
                [unit, required_ratio]
            );
        }

        // Broadcast so Director sees updated required ratio live
        const io = req.app.get("io");
        if (io) io.emit("ratio_log_updated", { unit });

        res.json({ message: "Required ratio updated successfully" });
    } catch (err) {
        console.error("Error updating required ratio:", err);
        res.status(500).json({ error: "Failed to update required ratio" });
    }
};