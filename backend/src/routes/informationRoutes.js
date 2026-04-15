const express = require("express");
const router = express.Router();

const controller = require("../controllers/informationController");

// GET
router.get("/:id", controller.getInformation);

// UPDATE
router.put("/:id", controller.updateInformation);

module.exports = router;