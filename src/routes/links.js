const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const { protect } = require('../middleware/auth');

router.get('/', linkController.getAllLinks);
router.get('/category/:category', linkController.getByCategory);
router.get('/state/:state', linkController.getByState);
router.get('/bookmarked', protect, linkController.getBookmarked);
router.get('/:id', linkController.getLinkById);
router.post('/', protect, linkController.createLink);
router.put('/:id', protect, linkController.updateLink);
router.delete('/:id', protect, linkController.deleteLink);
router.post('/:id/click', linkController.trackClick);
router.post('/:id/bookmark', protect, linkController.bookmarkLink);
router.post('/:id/verify', protect, linkController.verifyLink);

module.exports = router;
