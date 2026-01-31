const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructor: { type: String },
  platform: { type: String },
  platformLogo: { type: String },
  thumbnail: { type: String },
  url: { type: String },
  price: {
    amount: { type: Number },
    currency: { type: String },
    isFree: { type: Boolean },
    discount: { type: Number },
    studentDiscount: { type: String }
  },
  duration: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  rating: { type: Number },
  reviewCount: { type: Number },
  enrollmentCount: { type: Number },
  category: { type: String },
  tags: [{ type: String }],
  skillsGained: [{ type: String }],
  recommendedFor: [{ type: String }],
  certificate: { type: Boolean },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  enrolledBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
