const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true, select: false },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  college: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    name: { type: String },
    location: { type: String }
  },
  branch: { type: String, enum: ['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'Other'] },
  year: { type: Number, min: 1, max: 4 },
  graduationYear: { type: Number },
  interests: [{ type: String }],
  skills: [{ type: String }],
  language: { type: String, enum: ['en', 'te'], default: 'en' },
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
  notificationPreferences: {
    jobs: { type: Boolean, default: true },
    resources: { type: Boolean, default: true },
    community: { type: Boolean, default: true },
    email: { type: Boolean, default: true }
  },
  stats: {
    resourcesDownloaded: { type: Number, default: 0 },
    contributionsMade: { type: Number, default: 0 },
    helpfulAnswers: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
  },
  badges: [{
    name: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
