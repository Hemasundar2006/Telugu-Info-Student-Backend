const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload');

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/profile-picture', uploadProfilePicture, userController.uploadProfilePicture);
router.put('/preferences', userController.updatePreferences);
router.put('/language', userController.updateLanguage);
router.put('/theme', userController.updateTheme);
router.get('/stats', userController.getStats);
router.get('/badges', userController.getBadges);
router.delete('/account', userController.deleteAccount);

module.exports = router;
