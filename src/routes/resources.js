const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { protect, optional } = require('../middleware/auth');
const { uploadSingleFile } = require('../middleware/upload');
const { validateResource, validateRating, validateComment } = require('../validators/resourceValidator');
const { validate } = require('../middleware/validate');

router.get('/', resourceController.getAllResources);
router.get('/search', resourceController.searchResources);
router.get('/branch/:branch', resourceController.getByBranch);
router.get('/subject/:subject', resourceController.getBySubject);
router.get('/semester/:sem', resourceController.getBySemester);
router.get('/my-uploads', protect, resourceController.getMyUploads);
router.get('/bookmarked', protect, resourceController.getBookmarked);
router.get('/:id', optional, resourceController.getResourceById);
router.post('/', protect, uploadSingleFile, validateResource, validate, resourceController.uploadResource);
router.put('/:id', protect, resourceController.updateResource);
router.delete('/:id', protect, resourceController.deleteResource);
router.get('/:id/download', optional, resourceController.downloadResource);
router.post('/:id/view', resourceController.incrementView);
router.post('/:id/rate', protect, validateRating, validate, resourceController.rateResource);
router.get('/:id/ratings', resourceController.getRatings);
router.post('/:id/comment', protect, validateComment, validate, resourceController.addComment);
router.get('/:id/comments', resourceController.getComments);
router.post('/:id/bookmark', protect, resourceController.bookmarkResource);

module.exports = router;
