const User = require('../models/User');
const Resource = require('../models/Resource');
const Job = require('../models/Job');
const Application = require('../models/Application');
const ForumPost = require('../models/ForumPost');

exports.getDashboard = async (req, res) => {
  try {
    const [usersCount, resourcesCount, jobsCount, applicationsCount, postsCount] = await Promise.all([
      User.countDocuments(),
      Resource.countDocuments({ status: 'approved' }),
      Job.countDocuments({ isActive: true, applicationDeadline: { $gte: new Date() } }),
      Application.countDocuments(),
      ForumPost.countDocuments()
    ]);
    res.json({
      success: true,
      dashboard: {
        totalUsers: usersCount,
        totalResources: resourcesCount,
        activeJobs: jobsCount,
        totalApplications: applicationsCount,
        forumPosts: postsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPopularResources = async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'approved' })
      .sort({ downloads: -1, views: -1 }).limit(20).populate('uploadedBy', 'name');
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTrendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, applicationDeadline: { $gte: new Date() } })
      .sort({ priority: -1, applicationCount: -1 }).limit(20);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getActiveUsers = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    if (String(userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const [uploads, applications, posts] = await Promise.all([
      Resource.find({ uploadedBy: userId }).select('title createdAt').sort({ createdAt: -1 }).limit(20),
      Application.find({ user: userId }).populate('job', 'title.en').sort({ appliedAt: -1 }).limit(20),
      ForumPost.find({ author: userId }).select('title createdAt').sort({ createdAt: -1 }).limit(20)
    ]);
    res.json({ success: true, activity: { uploads, applications, posts } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
