const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const pool = require("../db");

// Storage config — saves files in backend/uploads/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../uploads"));
    },
    filename: (req, file, cb) => {
        // e.g.  31_cv_1713180000000.pdf
        const unique = `${req.params.user_id}_${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error("Only PDF and image files are allowed"));
    }
});

// Column name map — fieldname → DB column
const fieldToColumn = {
    cv: "cv_path",
    hospital_id: "hospital_id_path",
    national_id: "national_id_path",
    passport: "passport_path",
    picture: "picture_path"
};

// POST /api/uploads/:user_id/:docType
// docType: cv | hospital_id | national_id | passport | picture
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

        // Save relative path in DB
        const filePath = `uploads/${req.file.filename}`;

        await pool.query(
            `UPDATE Nursing_staff SET \`${column}\` = ? WHERE user_id = ?`,
            [filePath, user_id]
        );

        res.json({ success: true, path: filePath });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/uploads/:user_id — get all doc paths for a nurse
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