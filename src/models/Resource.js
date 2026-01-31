const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    te: { type: String }
  },
  description: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileType: { type: String, enum: ['pdf', 'video', 'link', 'document'], required: true },
  filePath: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  thumbnail: { type: String },
  branch: { type: String, enum: ['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'All', 'Other'] },
  subject: { type: String },
  semester: { type: Number, min: 1, max: 8 },
  category: { type: String, enum: ['notes', 'assignment', 'paper', 'lab', 'project'] },
  tags: [{ type: String }],
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
