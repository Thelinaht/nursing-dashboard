const express = require("express");
const router = express.Router();
const surveyController = require("../controllers/surveyController");

// GET /api/surveys/pending?user_id=37
router.get("/pending", surveyController.getPending);

// POST /api/surveys/submit  — body: { user_id, period_id, responses }
router.post("/submit", surveyController.submit);

// GET /api/surveys/results?year=2025&type=pes_nwi&role_id=4
router.get("/results", surveyController.getResults);

module.exports = router;