const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

exports.generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.slugify = (text) => {
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

exports.calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / wordsPerMinute) || 1;
  return `${minutes} min read`;
};
