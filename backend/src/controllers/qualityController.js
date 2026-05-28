const model = require("../models/qualityModel");

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