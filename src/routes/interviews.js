const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.get('/experiences', interviewController.getAllExperiences);
router.get('/experiences/:id', interviewController.getExperienceById);
router.post('/experiences', protect, interviewController.createExperience);
router.put('/experiences/:id', protect, interviewController.updateExperience);
router.delete('/experiences/:id', protect, interviewController.deleteExperience);
router.post('/experiences/:id/upvote', protect, interviewController.upvoteExperience);
router.post('/experiences/:id/comment', protect, interviewController.commentExperience);
router.get('/questions', interviewController.getAllQuestions);
router.get('/questions/search', interviewController.searchQuestions);
router.get('/questions/bookmarked', protect, interviewController.getBookmarkedQuestions);
router.get('/questions/:id', interviewController.getQuestionById);
router.post('/questions', protect, interviewController.createQuestion);
router.post('/questions/:id/upvote', protect, interviewController.upvoteQuestion);
router.post('/questions/:id/bookmark', protect, interviewController.bookmarkQuestion);
router.get('/companies', interviewController.getCompanies);

module.exports = router;
