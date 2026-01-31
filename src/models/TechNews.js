const mongoose = require('mongoose');

const techNewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  image: { type: String },
  source: {
    name: { type: String },
    url: { type: String }
  },
  category: { type: String, enum: ['ai', 'cybersecurity', 'startups', 'products', 'career'] },
  tags: [{ type: String }],
  publishedAt: { type: Date },
  readTime: { type: String },
  views: { type: Number, default: 0 },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TechNews', techNewsSchema);
