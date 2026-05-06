const express = require("express");
const router = express.Router();
const controller = require("../controllers/trainingController");

// GET dashboard data
router.get("/dashboard/data", controller.getDashboardData);

// GET trainees directory
router.get("/trainees/directory", controller.getTrainees);

// GET all programs + nurse records by user_id
router.get("/:id", controller.getByUser);

// UPSERT training record
router.put("/", controller.upsert);

// Upload certificate for a specific training
router.post(
    "/certificate/:userId/:trainingId",
    controller.upload.single("file"),
    controller.uploadCertificate
);

module.exports = router;