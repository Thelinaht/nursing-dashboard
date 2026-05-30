const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/approvalController");

router.get("/", ctrl.getAll);
router.get("/request/:request_id", ctrl.getByRequest);
router.post("/supervisor", ctrl.supervisorDecision);
router.post("/assistant", ctrl.assistantDecision);
router.post("/director", ctrl.directorDecision);

module.exports = router;