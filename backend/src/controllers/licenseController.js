const model = require("../models/licenseModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        cb(null, "saudi_council_" + req.params.userId + "_" + Date.now() + path.extname(file.originalname));
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

exports.getByUser = async (req, res) => {
    try {
        const data = await model.getByUserId(req.params.userId);
        res.json(data || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.upsertByUser = async (req, res) => {
    try {
        const licenseId = await model.upsertByUserId(req.params.userId, req.body);
        res.json({ success: true, license_id: licenseId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.uploadCertificate = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const licenseData = await model.getByUserId(req.params.userId);
        if (!licenseData) return res.status(404).json({ error: "No license found for this nurse" });

        const filePath = "uploads/" + req.file.filename;
        await model.updateCertificatePath(licenseData.license_id, filePath);
        res.json({ success: true, path: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};