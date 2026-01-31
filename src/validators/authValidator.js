const { body } = require('express-validator');

exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().isString().trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('branch').notEmpty().withMessage('Branch is required'),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be 1-4')
];

exports.validateLogin = [
  body('email').optional().isEmail(),
  body('phone').optional().isString(),
  body('password').notEmpty().withMessage('Password is required')
];

exports.validateForgotPassword = [
  body('email').isEmail().withMessage('Valid email required')
];

exports.validateResetPassword = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];
