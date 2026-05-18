const researchModel = require("../models/researchModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ========== Multer config for publication PDFs ========== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep filename short — DB column is VARCHAR(45)
        // Format: pub_<timestamp>.pdf  (max ~25 chars)
        const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
        cb(null, `pub_${Date.now()}${ext}`);
    }
});

exports.upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === ".pdf") cb(null, true);
        else cb(new Error("Only PDF files are allowed"));
    }
});

/* ========== PROJECTS ========== */
exports.getProjects = async (req, res) => {
    try {
        const projects = await researchModel.getAllProjects();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { title, status, start_date, investigator_name } = req.body;
        if (!title || !title.trim()) return res.status(400).json({ error: "Project title is required." });
        if (!["Active", "Completed"].includes(status)) return res.status(400).json({ error: "Status must be 'Active' or 'Completed'." });

        const insertId = await researchModel.createProject({
            title: title.trim(),
            status,
            start_date,
            investigator_name: investigator_name?.trim() || null
        });
        res.status(201).json({ success: true, project_id: insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, start_date, investigator_name } = req.body;
        if (!title || !title.trim()) return res.status(400).json({ error: "Project title is required." });
        if (!["Active", "Completed"].includes(status)) return res.status(400).json({ error: "Status must be 'Active' or 'Completed'." });

        const affected = await researchModel.updateProject(id, {
            title: title.trim(),
            status,
            start_date,
            investigator_name: investigator_name?.trim() || null
        });
        if (affected === 0) return res.status(404).json({ error: "Project not found." });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ========== PUBLICATIONS ========== */
exports.getPublications = async (req, res) => {
    try {
        const publications = await researchModel.getAllPublications();
        res.json(publications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPublication = async (req, res) => {
    try {
        const { title, author_name, type, date, journal_name } = req.body;
        if (!title || !title.trim()) return res.status(400).json({ error: "Publication title is required." });
        if (type && !["Published", "Presented"].includes(type)) {
            return res.status(400).json({ error: "Type must be 'Published' or 'Presented'." });
        }

        const PublishedFile_path = req.file ? req.file.filename : null;

        const insertId = await researchModel.createPublication({
            title: title.trim(),
            author_name: author_name?.trim() || null,
            type: type || null,
            date: date || null,
            journal_name: journal_name?.trim() || null,
            PublishedFile_path
        });
        res.status(201).json({ success: true, publication_id: insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePublication = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author_name, type, date, journal_name } = req.body;
        if (!title || !title.trim()) return res.status(400).json({ error: "Publication title is required." });
        if (type && !["Published", "Presented"].includes(type)) {
            return res.status(400).json({ error: "Type must be 'Published' or 'Presented'." });
        }

        const payload = {
            title: title.trim(),
            author_name: author_name?.trim() || null,
            type: type || null,
            date: date || null,
            journal_name: journal_name?.trim() || null
        };

        // Only update the file path if a new file was uploaded
        if (req.file) {
            // Delete the old file if it exists
            const old = await researchModel.getPublicationById(id);
            if (old && old.PublishedFile_path) {
                const oldPath = path.join(__dirname, "../../uploads", old.PublishedFile_path);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
                }
            }
            payload.PublishedFile_path = req.file.filename;
        }

        const affected = await researchModel.updatePublication(id, payload);
        if (affected === 0) return res.status(404).json({ error: "Publication not found." });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};