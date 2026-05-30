const express = require("express");
const router = express.Router();

const controller = require("../controllers/requestsController");

router.get("/", controller.getAll);
router.get("/nurse/:nurse_id", controller.getByNurseId);
router.get("/:id", controller.getOne);
router.post("/", controller.create);


router.put("/:id/status", controller.updateStatus);

router.delete("/:id", controller.remove);

module.exports = router;
// ── Attachments ───────────────────────────────────────────────────────────────
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        cb(null, `req_${req.params.request_id}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error("Only PDF and images allowed"));
    }
});

// POST /api/requests/:request_id/attachments
router.post("/:request_id/attachments", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const filePath = `uploads/${req.file.filename}`;
        await pool.query(
            `INSERT INTO Request_attachment (request_id, file_name, file_path) VALUES (?, ?, ?)`,
            [req.params.request_id, req.file.originalname, filePath]
        );
        res.json({ success: true, file_name: req.file.originalname, file_path: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/requests/:request_id/attachments
router.get("/:request_id/attachments", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM Request_attachment WHERE request_id = ?`,
            [req.params.request_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});