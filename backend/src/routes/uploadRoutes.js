const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db");

// Make sure uploads folder exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const unique = `${req.params.user_id}_${req.params.docType}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error("Only PDF and image files are allowed"));
    }
});

// Column name map
const fieldToColumn = {
    cv: "cv_path",
    hospital_id: "hospital_id_path",
    national_id: "national_id_path",
    passport: "passport_path",
    picture: "picture_path"
};

// POST /api/uploads/:user_id/:docType
router.post("/:user_id/:docType", upload.single("file"), async (req, res) => {
    try {
        const { user_id, docType } = req.params;
        const column = fieldToColumn[docType];

        if (!column) {
            return res.status(400).json({ error: "Invalid document type" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = `uploads/${req.file.filename}`;

        await pool.query(
            `UPDATE Nursing_staff SET \`${column}\` = ? WHERE user_id = ?`,
            [filePath, user_id]
        );

        res.json({ success: true, path: filePath });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/uploads/:user_id
router.get("/:user_id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT cv_path, hospital_id_path, national_id_path, passport_path, picture_path
             FROM Nursing_staff WHERE user_id = ?`,
            [req.params.user_id]
        );
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;