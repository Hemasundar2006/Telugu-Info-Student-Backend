const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String },
  category: { type: String, enum: ['technical', 'hr', 'aptitude'] },
  topic: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  company: { type: String },
  askedBy: [{ type: String }],
  tags: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
