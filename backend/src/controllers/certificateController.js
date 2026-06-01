const model = require("../models/certificateModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        cb(null, `cert_${req.params.userId}_${req.params.typeId}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

exports.upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error("Only PDF and images allowed"));
    }
});

// GET cert types + staff certs by user_id
exports.getByUser = async (req, res) => {
    try {
        const types = await model.getAllTypes();
        const nurseId = await model.getNurseIdByUserId(req.params.userId);
        const certs = nurseId ? await model.getByNurseId(nurseId) : [];
        res.json({ nurseId, types, certs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// UPSERT by type_id
exports.upsert = async (req, res) => {
    try {
        const nurseId = await model.getNurseIdByUserId(req.params.userId);
        if (!nurseId) return res.status(404).json({ error: "Nurse not found" });
        await model.upsertByTypeId(nurseId, req.params.typeId, req.body);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Upload file
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const nurseId = await model.getNurseIdByUserId(req.params.userId);
        if (!nurseId) return res.status(404).json({ error: "Nurse not found" });
        const filePath = "uploads/" + req.file.filename;
        await model.updateFilePath(nurseId, req.params.typeId, filePath);
        res.json({ success: true, path: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};