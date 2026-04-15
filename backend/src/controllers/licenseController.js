const model = require("../models/licenseModel");

exports.getAllLicenses = async (req, res) => {
    try {
        const data = await model.getAllLicenses();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getExpiringLicenses = async (req, res) => {
    try {
        const data = await model.getExpiringLicenses();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};