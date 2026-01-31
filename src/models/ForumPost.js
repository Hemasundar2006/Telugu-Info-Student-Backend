const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['academic_doubts', 'placement_stories', 'project_ideas', 'study_groups', 'career_advice', 'college_life'] },
  tags: [{ type: String }],
  images: [{ type: String }],
  attachments: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: { type: Number, default: 0 },
  downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewCount: { type: Number, default: 0 },
  answerCount: { type: Number, default: 0 },
  isSolved: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isReported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ForumPost', forumPostSchema);
