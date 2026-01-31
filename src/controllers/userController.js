const User = require('../models/User');
const fs = require('fs');
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'college', 'branch', 'year', 'graduationYear', 'interests', 'skills'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const oldPath = req.user.profilePicture;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: req.file.path || `uploads/profiles/${req.file.filename}` },
      { new: true }
    ).select('-password');
    if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    res.json({ success: true, user, profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { notificationPreferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: notificationPreferences || req.user.notificationPreferences },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'te'].includes(language)) return res.status(400).json({ success: false, error: 'Invalid language' });
    const user = await User.findByIdAndUpdate(req.user._id, { language }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark', 'auto'].includes(theme)) return res.status(400).json({ success: false, error: 'Invalid theme' });
    const user = await User.findByIdAndUpdate(req.user._id, { theme }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('stats badges');
    res.json({ success: true, stats: user.stats, badges: user.badges });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('badges');
    res.json({ success: true, badges: user.badges || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
