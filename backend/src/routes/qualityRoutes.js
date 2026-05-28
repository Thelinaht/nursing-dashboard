const express = require("express");
const router = express.Router();
const controller = require("../controllers/qualityController");

// ── Falls (Quality_FI) ──────────────────────────────────────
router.get("/falls", controller.getAllFalls);
router.post("/falls", controller.createFall);
router.put("/falls/:id", controller.updateFall);
router.delete("/falls/:id", controller.deleteFall);

// ── HAPI (Quality_HAPI) ─────────────────────────────────────
router.get("/hapi", controller.getAllHapi);
router.post("/hapi", controller.createHapi);
router.put("/hapi/:id", controller.updateHapi);
router.delete("/hapi/:id", controller.deleteHapi);

// ── Medication (Quality_Medication) ─────────────────────────
router.get("/meds", controller.getAllMeds);
router.post("/meds", controller.createMed);
router.put("/meds/:urn", controller.updateMed);
router.delete("/meds/:urn", controller.deleteMed);

module.exports = router;