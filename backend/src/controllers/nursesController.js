const nursesModel = require("../models/nursesModel");

// GET all
exports.getAll = async (req, res) => {
    try {
        const nurses = await nursesModel.getAllNurses();
        res.json(nurses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET one
exports.getOne = async (req, res) => {
    try {
        const nurse = await nursesModel.getNurseById(req.params.id);
        res.json(nurse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE
exports.create = async (req, res) => {
    try {
        const result = await nursesModel.createNurse(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        const result = await nursesModel.updateNurse(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE
exports.remove = async (req, res) => {
    try {
        const result = await nursesModel.deleteNurse(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByUserId = async (req, res) => {
    try {
        const nurse = await nursesModel.getNurseByUserId(req.params.user_id);
        res.json(nurse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// UPDATE unit only
exports.updateUnit = async (req, res) => {
    try {
        const { unit } = req.body;
        if (!unit) return res.status(400).json({ message: "Unit is required" });
        const pool = require("../db");
        await pool.query(
            "UPDATE Nursing_staff SET unit = ? WHERE nurse_id = ?",
            [unit, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};