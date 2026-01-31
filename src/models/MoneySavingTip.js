const mongoose = require('mongoose');

const moneySavingTipSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    te: { type: String }
  },
  description: { type: String },
  category: { type: String, enum: ['student_discount', 'scholarship', 'budget_tip', 'cashback', 'free_resource'] },
  platform: { type: String },
  link: { type: String },
  discount: { type: String },
  validUntil: { type: Date },
  icon: { type: String },
  tags: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MoneySavingTip', moneySavingTipSchema);
