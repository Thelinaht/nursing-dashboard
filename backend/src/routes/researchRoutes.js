const express = require("express");
const router = express.Router();
const researchController = require("../controllers/researchController");

router.get("/projects", researchController.getProjects);
router.get("/publications", researchController.getPublications);

module.exports = router;
