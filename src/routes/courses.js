const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, optional } = require('../middleware/auth');

router.get('/', courseController.getAllCourses);
router.get('/search', courseController.searchCourses);
router.get('/recommended', protect, courseController.getRecommended);
router.get('/category/:category', courseController.getByCategory);
router.get('/enrolled', protect, courseController.getEnrolled);
router.get('/bookmarked', protect, courseController.getBookmarked);
router.get('/:id', optional, courseController.getCourseById);
router.post('/:id/bookmark', protect, courseController.bookmarkCourse);
router.post('/:id/enroll', protect, courseController.enrollCourse);
router.put('/:id/progress', protect, courseController.updateProgress);

module.exports = router;
