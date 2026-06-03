const model = require("../models/qualityModel");
const notificationController = require("./notificationController");

// ============================================================
// FALLS
// ============================================================

exports.getAllFalls = async (req, res) => {
    try {
        const data = await model.getAllFalls();
        res.json(data);
    } catch (err) {
        console.error("getAllFalls error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.createFall = async (req, res) => {
    try {
        const result = await model.createFall(req.body);
        
        // System-wide notification
        const io = req.app.get("io");
        await notificationController.createNotificationForRoles({
            title: "New Fall Incident Reported",
            message: `A new fall incident with injury severity '${req.body.Injury_Severity}' was reported in unit '${req.body.Unit}'.`,
            notification_type: req.body.Injury_Severity === 'Major' ? 'error' : 'warning',
            priority: req.body.Injury_Severity === 'Major' ? 'critical' : 'high',
            category: "Quality Indicator"
        }, [4, 5, 8], io);

        res.status(201).json({ success: true, insertId: result.insertId });
    } catch (err) {
        console.error("createFall error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateFall = async (req, res) => {
    try {
        const result = await model.updateFall(req.params.id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("updateFall error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFall = async (req, res) => {
    try {
        const result = await model.deleteFall(req.params.id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("deleteFall error:", err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// HAPI
// ============================================================

exports.getAllHapi = async (req, res) => {
    try {
        const data = await model.getAllHapi();
        res.json(data);
    } catch (err) {
        console.error("getAllHapi error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.createHapi = async (req, res) => {
    try {
        const result = await model.createHapi(req.body);

        // System-wide notification
        const io = req.app.get("io");
        await notificationController.createNotificationForRoles({
            title: "New HAPI Incident Reported",
            message: `A new Hospital-Acquired Pressure Injury (Stage ${req.body.Stage}) was reported in unit '${req.body.Unit}'.`,
            notification_type: 'error',
            priority: 'critical',
            category: "Quality Indicator"
        }, [4, 5, 8], io);

        res.status(201).json({ success: true, insertId: result.insertId });
    } catch (err) {
        console.error("createHapi error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateHapi = async (req, res) => {
    try {
        const result = await model.updateHapi(req.params.id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("updateHapi error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteHapi = async (req, res) => {
    try {
        const result = await model.deleteHapi(req.params.id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("deleteHapi error:", err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// MEDICATION
// ============================================================

exports.getAllMeds = async (req, res) => {
    try {
        const data = await model.getAllMeds();
        res.json(data);
    } catch (err) {
        console.error("getAllMeds error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.createMed = async (req, res) => {
    try {
        const result = await model.createMed(req.body);

        // System-wide notification
        const io = req.app.get("io");
        await notificationController.createNotificationForRoles({
            title: "New Medication Error Reported",
            message: `A medication error of type '${req.body.Type}' was reported in unit '${req.body.Unit}'.`,
            notification_type: 'error',
            priority: 'critical',
            category: "Quality Indicator"
        }, [4, 5, 8], io);

        res.status(201).json({ success: true, insertId: result.insertId });
    } catch (err) {
        console.error("createMed error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateMed = async (req, res) => {
    try {
        const result = await model.updateMed(req.params.urn, req.body);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found" });
        res.json({ success: true });
    } catch (err) {
        console.error("updateMed error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMed = async (req, res) => {
    try {
        const result = await model.deleteMed(req.params.urn);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found" });
        res.json({ success: true });
    } catch (err) {
        console.error("deleteMed error:", err);
        res.status(500).json({ error: err.message });
    }
};