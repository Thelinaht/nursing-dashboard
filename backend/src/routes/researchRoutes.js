const express = require("express");
const router = express.Router();
const researchController = require("../controllers/researchController");

/* Projects */
router.get("/projects", researchController.getProjects);
router.post("/projects", researchController.createProject);
router.put("/projects/:id", researchController.updateProject);

/* Publications */
router.get("/publications", researchController.getPublications);
router.post(
    "/publications",
    researchController.upload.single("pdf"),
    researchController.createPublication
);
router.put(
    "/publications/:id",
    researchController.upload.single("pdf"),
    researchController.updatePublication
);

module.exports = router;