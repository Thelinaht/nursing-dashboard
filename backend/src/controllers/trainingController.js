const model = require("../models/trainingModel");

// GET
exports.getByNurse = async (req, res) => {
    try {
        const data = await model.getByNurseId(req.params.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        const { nurse_id, training_id, ...rest } = req.body;

        const result = await model.updateTraining(
            nurse_id,
            training_id,
            rest
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};