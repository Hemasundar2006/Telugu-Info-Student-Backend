const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String },
  location: {
    city: { type: String },
    state: { type: String, enum: ['AP', 'Telangana'] },
    pincode: { type: String }
  },
  university: { type: String },
  website: { type: String },
  branches: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  studentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('College', collegeSchema);
