const express = require("express");
const router = express.Router();

const controller = require("../controllers/trainingController");

router.get("/:id", controller.getByNurse);
router.put("/", controller.update);

module.exports = router;