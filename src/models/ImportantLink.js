const mongoose = require('mongoose');

const importantLinkSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    te: { type: String }
  },
  description: { type: String },
  url: { type: String, required: true },
  category: { type: String, enum: ['exam_registration', 'scholarship', 'university', 'govt_scheme', 'internship', 'coding_contest', 'research'] },
  icon: { type: String },
  tags: [{ type: String }],
  state: { type: String, enum: ['AP', 'Telangana', 'All India'] },
  isActive: { type: Boolean, default: true },
  lastVerified: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clickCount: { type: Number, default: 0 },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ImportantLink', importantLinkSchema);
