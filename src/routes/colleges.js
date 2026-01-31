const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { protect } = require('../middleware/auth');

router.get('/', collegeController.getAllColleges);
router.get('/search', collegeController.searchColleges);
router.get('/state/:state', collegeController.getByState);
router.get('/:id', collegeController.getCollegeById);
router.post('/', protect, collegeController.createCollege);

module.exports = router;
