const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    te: { type: String }
  },
  description: { type: String },
  company: {
    name: { type: String },
    logo: { type: String },
    website: { type: String }
  },
  jobType: { type: String, enum: ['government', 'private', 'internship', 'walkin'] },
  department: { type: String, enum: ['central', 'state_ap', 'state_telangana', 'psu', 'mnc', 'startup'] },
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    isRemote: { type: Boolean, default: false }
  },
  eligibility: {
    branches: [{ type: String }],
    qualification: { type: String },
    minPercentage: { type: Number },
    maxBacklogs: { type: Number },
    passingYear: [{ type: Number }]
  },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  vacancies: { type: Number },
  applicationDeadline: { type: Date },
  examDate: { type: Date },
  importantDates: [{
    event: { type: String },
    date: { type: Date }
  }],
  requiredDocuments: [{ type: String }],
  howToApply: { type: String },
  registrationLink: { type: String, required: true },
  applicationProcess: { type: String },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String },
  applicationCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
