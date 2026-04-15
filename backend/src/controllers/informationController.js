const informationModel = require("../models/informationModel");

// GET
exports.getInformation = async (req, res) => {
    try {
        const data = await informationModel.getById(req.params.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
exports.updateInformation = async (req, res) => {
    try {
        const result = await informationModel.updateById(
            req.params.id,
            req.body
        );
        res.json(result);
    } catch (err) {
        console.error("UPDATE ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
};