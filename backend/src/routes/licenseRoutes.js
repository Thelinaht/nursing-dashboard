const express = require("express");
const router = express.Router();
const controller = require("../controllers/licenseController");

// Existing routes
router.get("/", controller.getAllLicenses);
router.get("/expiring", controller.getExpiringLicenses);

// Nurse-specific routes (Saudi Council)
router.get("/nurse/:userId", controller.getByUser);
router.put("/nurse/:userId", controller.upsertByUser);
router.post(
    "/nurse/:userId/upload",
    controller.upload.single("file"),
    controller.uploadCertificate
);

module.exports = router;