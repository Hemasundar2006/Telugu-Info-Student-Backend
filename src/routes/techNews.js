const express = require('express');
const router = express.Router();
const techNewsController = require('../controllers/techNewsController');
const { protect, optional } = require('../middleware/auth');

router.get('/', techNewsController.getAllNews);
router.get('/category/:cat', techNewsController.getByCategory);
router.get('/bookmarked', protect, techNewsController.getBookmarked);
router.get('/:id', optional, techNewsController.getNewsById);
router.post('/:id/view', techNewsController.incrementView);
router.post('/:id/bookmark', protect, techNewsController.bookmarkNews);

module.exports = router;
