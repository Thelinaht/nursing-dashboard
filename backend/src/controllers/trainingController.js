const model = require("../models/trainingModel");
const multer = require("multer");
const path = require("path");
const pool = require("../db");

// Storage for certificates
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, "../../uploads"));
    },
    filename: (req, file, cb) => {
        const name = `cert_${req.params.userId}_${req.params.trainingId}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, name);
    }
});

exports.upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error("Only PDF and images allowed"));
    }
});

// GET all programs + trainee records
exports.getByUser = async (req, res) => {
    try {
        const result = await model.getByUserId(req.params.id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// UPSERT (update or insert) a training record
exports.upsert = async (req, res) => {
    try {
        const { nurse_id, trainee_id, training_id, ...rest } = req.body;
        const targetId = trainee_id || nurse_id;
        const result = await model.upsertTraining(targetId, training_id, rest);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Upload certificate file
exports.uploadCertificate = async (req, res) => {
    try {
        const { userId, trainingId } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded or file type not allowed" });
        }

        // Get trainee_id from user_id
        const [rows] = await pool.query(
            "SELECT trainee_id FROM Trainee WHERE user_id = ?", [userId]
        );
        if (!rows[0]) return res.status(404).json({ error: "Trainee not found" });

        const filePath = `uploads/${req.file.filename}`;
        await model.updateCertificatePath(rows[0].trainee_id, trainingId, filePath);

        res.json({ success: true, path: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET all dashboard data (KPIs, mandatory, competencies, etc.)
exports.getDashboardData = async (req, res) => {
    try {
        const result = await model.getDashboardData();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET all trainees for directory
exports.getTrainees = async (req, res) => {
    try {
        const result = await model.getTrainees();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// UPDATE dashboard row dynamically
exports.updateDashboardRow = async (req, res) => {
    try {
        const { type, id, fields } = req.body;
        const result = await model.updateDashboardRow(type, id, fields);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET trainee profile by user_id
exports.getTraineeByUser = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                t.*, 
                u.email,
                t.full_name AS name
             FROM Trainee t
             LEFT JOIN User u ON t.user_id = u.user_id
             WHERE t.user_id = ?`,
            [req.params.userId]
        );
        if (!rows[0]) return res.status(404).json({ error: "Trainee not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET all units from Hospital_unit
exports.getHospitalUnits = async (req, res) => {
    try {
        const result = await model.getHospitalUnits();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// DELETE program item
exports.deleteProgramItem = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await model.deleteProgramItem(id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};