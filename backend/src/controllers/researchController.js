const researchModel = require("../models/researchModel");

exports.getProjects = async (req, res) => {
    try {
        const projects = await researchModel.getAllProjects();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPublications = async (req, res) => {
    try {
        const publications = await researchModel.getAllPublications();
        res.json(publications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
