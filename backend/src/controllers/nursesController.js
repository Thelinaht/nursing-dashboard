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
