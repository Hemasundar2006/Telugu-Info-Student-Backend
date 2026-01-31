const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/popular-resources', analyticsController.getPopularResources);
router.get('/trending-jobs', analyticsController.getTrendingJobs);
router.get('/active-users', analyticsController.getActiveUsers);
router.get('/user-activity', analyticsController.getUserActivity);

module.exports = router;
