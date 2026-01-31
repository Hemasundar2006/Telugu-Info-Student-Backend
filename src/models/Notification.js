const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['job', 'resource', 'community', 'reminder', 'system'] },
  title: { type: String, required: true },
  message: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
  icon: { type: String },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('Notification', notificationSchema);
