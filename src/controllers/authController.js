const User = require('../models/User');
const { generateToken, hashToken, generateRandomToken } = require('../utils/helpers');
const emailService = require('../services/emailService');
const gamificationService = require('../services/gamificationService');

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, college, branch, year, graduationYear } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ success: false, error: 'Email or phone is required' });
    }
    const existing = email ? await User.findOne({ email: email.toLowerCase() }) : await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists with this email/phone' });
    }
    const verificationToken = generateRandomToken();
    const user = await User.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      phone: phone || undefined,
      password,
      college: college || {},
      branch,
      year,
      graduationYear,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    if (user.email) {
      try {
        await emailService.sendVerificationEmail(user, verificationToken);
      } catch (e) {
        console.error('Verification email error:', e);
      }
    }
    const token = generateToken(user._id);
    const u = user.toObject();
    delete u.password;
    delete u.verificationToken;
    delete u.resetPasswordToken;
    res.status(201).json({ success: true, user: u, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ success: false, error: 'Email or phone is required' });
    }
    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id);
    const u = user.toObject();
    delete u.password;
    res.json({ success: true, user: u, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const resetToken = generateRandomToken();
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail(user, resetUrl);
    res.json({ success: true, message: 'Reset email sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    await gamificationService.checkAndAwardBadges(user._id);
    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authorized' });
    const token = generateToken(req.user._id);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};
