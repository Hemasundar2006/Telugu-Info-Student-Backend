const User = require('../models/User');
const Resource = require('../models/Resource');
const Job = require('../models/Job');
const ForumPost = require('../models/ForumPost');

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * Math.min(100, parseInt(limit, 10) || 20);
    const lim = Math.min(100, parseInt(limit, 10) || 20);
    const [users, total] = await Promise.all([
      User.find({}).select('-password -verificationToken -resetPasswordToken').sort({ createdAt: -1 }).skip(skip).limit(lim),
      User.countDocuments()
    ]);
    res.json({ success: true, users, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (String(user._id) === String(req.user._id)) return res.status(400).json({ success: false, error: 'Cannot delete self' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPendingResources = async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'pending' })
      .populate('uploadedBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', isVerified: true, verifiedBy: req.user._id },
      { new: true }
    );
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.rejectResource = async (req, res) => {
  try {
    const { reason } = req.body;
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || '' },
      { new: true }
    );
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const posts = await ForumPost.find({ isReported: true, reportCount: { $gt: 0 } })
      .populate('author', 'name email').sort({ reportCount: -1 });
    res.json({ success: true, reports: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.handleReport = async (req, res) => {
  try {
    const { action } = req.body; // dismiss, remove
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (action === 'remove') {
      await ForumPost.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Post removed' });
    }
    post.isReported = false;
    post.reportCount = 0;
    await post.save();
    res.json({ success: true, message: 'Report dismissed', post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [users, resources, jobs, posts] = await Promise.all([
      User.countDocuments(),
      Resource.countDocuments(),
      Job.countDocuments({ isActive: true }),
      ForumPost.countDocuments()
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers: users,
        totalResources: resources,
        activeJobs: jobs,
        forumPosts: posts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
