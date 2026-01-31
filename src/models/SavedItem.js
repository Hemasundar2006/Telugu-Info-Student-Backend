const mongoose = require('mongoose');

const savedItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['job', 'resource', 'course', 'post', 'link'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  folder: { type: String, default: 'default' },
  notes: { type: String },
  savedAt: { type: Date, default: Date.now }
});

savedItemSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('SavedItem', savedItemSchema);
