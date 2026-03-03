const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, loginUser, forgotPassword, verifyPasswordResetOTP, resetPassword, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/verify', verifyOTP);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-verify', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;