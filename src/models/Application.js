const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['applied', 'in_review', 'shortlisted', 'rejected', 'selected', 'withdrawn'], default: 'applied' },
  appliedAt: { type: Date, default: Date.now },
  timeline: [{
    status: { type: String },
    date: { type: Date },
    notes: { type: String }
  }],
  reminderSet: { type: Boolean, default: false },
  reminderDate: { type: Date },
  notes: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
