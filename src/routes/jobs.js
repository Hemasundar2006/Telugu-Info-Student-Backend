const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

router.get('/', jobController.getAllJobs);
router.get('/search', jobController.searchJobs);
router.get('/recommended', protect, jobController.getRecommended);
router.get('/government', jobController.getGovernment);
router.get('/private', jobController.getPrivate);
router.get('/internships', jobController.getInternships);
router.get('/walk-ins', jobController.getWalkins);
router.get('/trending', jobController.getTrending);
router.get('/location/:state', jobController.getByLocation);
router.get('/my-applications', protect, jobController.getMyApplications);
router.get('/bookmarked', protect, jobController.getBookmarked);
router.get('/:id', jobController.getJobById);
router.post('/', protect, jobController.createJob);
router.put('/:id', protect, jobController.updateJob);
router.delete('/:id', protect, jobController.deleteJob);
router.post('/:id/bookmark', protect, jobController.bookmarkJob);
router.post('/:id/apply', protect, jobController.applyJob);
router.put('/applications/:id', protect, jobController.updateApplication);
router.post('/:id/remind', protect, jobController.setReminder);

module.exports = router;
