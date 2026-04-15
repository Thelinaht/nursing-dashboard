// routes/userRoutes.js
const express = require('express');
const { loginUser, getDashboard } = require('../controllers/userController');

const router = express.Router();

router.post('/login', loginUser);
router.get('/dashboard', getDashboard);

module.exports = router;