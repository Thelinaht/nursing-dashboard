const express = require("express");
const router = express.Router();
const controller = require("../controllers/licenseController");

router.get("/", controller.getAllLicenses);
router.get("/expiring", controller.getExpiringLicenses);

module.exports = router;