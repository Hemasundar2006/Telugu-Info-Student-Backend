const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/verify', adminController.verifyUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/resources/pending', adminController.getPendingResources);
router.put('/resources/:id/approve', adminController.approveResource);
router.put('/resources/:id/reject', adminController.rejectResource);
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.handleReport);
router.get('/stats', adminController.getStats);

module.exports = router;
