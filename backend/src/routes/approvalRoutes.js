const express = require("express");
const router = express.Router();

const approvalController = require("../controllers/approvalController");

router.get("/", approvalController.getAll);

// Supervisor
router.post("/supervisor", approvalController.supervisorDecision);

// Assistant
router.post("/assistant", approvalController.assistantDecision);

// Director
router.post("/director", approvalController.directorDecision);

module.exports = router;

