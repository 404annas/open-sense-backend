const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

// Protected route (Only SuperAdmin)
router.get('/stats', protect, superAdmin, getDashboardStats);

module.exports = router;