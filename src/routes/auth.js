const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../validators/authValidator');
const { validate } = require('../middleware/validate');

router.post('/register', validateRegister, validate, authController.register);
router.post('/login', validateLogin, validate, authController.login);
router.post('/forgot-password', validateForgotPassword, validate, authController.forgotPassword);
router.post('/reset-password/:token', validateResetPassword, validate, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/refresh-token', protect, authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
