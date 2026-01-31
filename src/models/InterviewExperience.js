const mongoose = require('mongoose');

const interviewExperienceSchema = new mongoose.Schema({
  company: {
    name: { type: String, required: true },
    logo: { type: String }
  },
  author: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String },
    branch: { type: String },
    college: { type: String },
    graduationYear: { type: Number }
  },
  role: { type: String },
  interviewDate: { type: Date },
  selectionStatus: { type: String, enum: ['selected', 'not_selected', 'waiting'] },
  rounds: [{
    roundNumber: { type: Number },
    roundType: { type: String, enum: ['aptitude', 'technical', 'hr', 'group_discussion', 'case_study'] },
    description: { type: String },
    questionsAsked: [{ type: String }],
    tips: { type: String },
    duration: { type: String }
  }],
  overallExperience: { type: String },
  preparationTips: { type: String },
  salary: {
    offered: { type: Number },
    currency: { type: String }
  },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: { type: Number, default: 0 },
  helpfulCount: { type: Number, default: 0 },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('InterviewExperience', interviewExperienceSchema);
