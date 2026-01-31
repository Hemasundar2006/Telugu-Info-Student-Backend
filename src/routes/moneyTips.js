const express = require('express');
const router = express.Router();
const moneyTipController = require('../controllers/moneyTipController');
const { protect } = require('../middleware/auth');

router.get('/', moneyTipController.getAllTips);
router.get('/category/:cat', moneyTipController.getByCategory);
router.get('/bookmarked', protect, moneyTipController.getBookmarked);
router.get('/:id', moneyTipController.getTipById);
router.post('/:id/bookmark', protect, moneyTipController.bookmarkTip);
router.post('/:id/upvote', protect, moneyTipController.upvoteTip);

module.exports = router;
