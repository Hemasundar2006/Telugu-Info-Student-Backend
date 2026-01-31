const { body } = require('express-validator');

exports.validateResource = [
  body('title.en').trim().notEmpty().withMessage('English title required'),
  body('title.te').optional().trim(),
  body('branch').notEmpty().withMessage('Branch required'),
  body('subject').notEmpty().withMessage('Subject required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8'),
  body('category').optional().isIn(['notes', 'assignment', 'paper', 'lab', 'project']),
  body('fileType').optional().isIn(['pdf', 'video', 'link', 'document']),
  body('description').optional().trim()
];

exports.validateRating = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('review').optional().trim()
];

exports.validateComment = [
  body('text').trim().notEmpty().withMessage('Comment text required')
];
