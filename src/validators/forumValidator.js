const { body } = require('express-validator');

exports.validatePost = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional().isIn(['academic_doubts', 'placement_stories', 'project_ideas', 'study_groups', 'career_advice', 'college_life'])
];

exports.validateAnswer = [
  body('content').trim().notEmpty().withMessage('Answer content is required')
];

exports.validateReply = [
  body('content').trim().notEmpty().withMessage('Reply content is required')
];
