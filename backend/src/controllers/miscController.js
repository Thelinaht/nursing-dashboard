const model = require("../models/miscModel");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../uploads"));
    },
    filename: (req, file, cb) => {
        const name = `misc_${req.params.userId}_${req.params.miscTypeId}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, name);
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

// GET
exports.getByUser = async (req, res) => {
    try {
        const result = await model.getByUserId(req.params.id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Upload file
exports.uploadFile = async (req, res) => {
    try {
        const { userId, miscTypeId } = req.params;
        const pool = require("../db");
        const [rows] = await pool.query(
            "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?", [userId]
        );
        if (!rows[0]) return res.status(404).json({ error: "Nurse not found" });

        const filePath = `uploads/${req.file.filename}`;
        const fileName = req.file.originalname;
        await model.addFile(rows[0].nurse_id, miscTypeId, fileName, filePath);

        res.json({ success: true, path: filePath, name: fileName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Delete file
exports.deleteFile = async (req, res) => {
    try {
        const { userId, docId } = req.params;
        const pool = require("../db");
        const [rows] = await pool.query(
            "SELECT nurse_id FROM Nursing_staff WHERE user_id = ?", [userId]
        );
        if (!rows[0]) return res.status(404).json({ error: "Nurse not found" });

        await model.deleteFile(docId, rows[0].nurse_id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};