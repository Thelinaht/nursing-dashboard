const express = require("express");
const router = express.Router();
const controller = require("../controllers/trainingController");

// GET dashboard data
router.get("/dashboard/data", controller.getDashboardData);

// GET trainees directory
router.get("/trainees/directory", controller.getTrainees);

// GET hospital units
router.get("/units", controller.getHospitalUnits);

// GET all programs + nurse records by user_id
router.get("/user/:userId", controller.getTraineeByUser);

// GET all programs + nurse records by user_id
router.get("/:id", controller.getByUser);

// UPSERT training record
router.put("/", controller.upsert);

// UPDATE dashboard row dynamically
router.put("/dashboard/update-row", controller.updateDashboardRow);

// DELETE dashboard program item
router.delete("/dashboard/program-item/:id", controller.deleteProgramItem);

// Upload certificate for a specific training
router.post(
    "/certificate/:userId/:trainingId",
    controller.upload.single("file"),
    controller.uploadCertificate
);

module.exports = router;