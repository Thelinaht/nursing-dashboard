const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/director-kpis', dashboardController.getDirectorKPIs);
router.get('/inpatient-staffing', dashboardController.getInpatientStaffing);
router.get('/ambulatory-staffing', dashboardController.getAmbulatoryStaffing);
router.get('/ratio-logs', dashboardController.getRatioLogs);
router.post('/ratio-logs', dashboardController.addRatioLog);
router.patch('/required-ratio', dashboardController.updateRequiredRatio);

module.exports = router;

