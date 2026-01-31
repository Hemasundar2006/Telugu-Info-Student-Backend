const Resource = require('../models/Resource');
const User = require('../models/User');
const SavedItem = require('../models/SavedItem');
const notificationService = require('../services/notificationService');
const gamificationService = require('../services/gamificationService');
const fs = require('fs');
const path = require('path');

const BRANCHES = ['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'All', 'Other'];
const CATEGORIES = ['notes', 'assignment', 'paper', 'lab', 'project'];

exports.getAllResources = async (req, res) => {
  try {
    const { branch, subject, semester, category, page = 1, limit = 20 } = req.query;
    const filter = { status: 'approved' };
    if (branch) filter.branch = branch;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (semester) filter.semester = parseInt(semester, 10);
    if (category) filter.category = category;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [resources, total] = await Promise.all([
      Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('uploadedBy', 'name profilePicture'),
      Resource.countDocuments(filter)
    ]);
    res.json({
      success: true,
      resources,
      total,
      pages: Math.ceil(total / lim),
      currentPage: Math.max(1, parseInt(page, 10))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'name profilePicture')
      .populate('comments.user', 'name profilePicture');
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    if (resource.status !== 'approved') {
      if (!req.user || (String(resource.uploadedBy._id) !== String(req.user._id) && req.user.role !== 'admin')) {
        return res.status(404).json({ success: false, error: 'Resource not found' });
      }
    }
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    resource.views += 1;
    const isBookmarked = req.user && resource.bookmarkedBy.some(id => String(id) === String(req.user._id));
    res.json({ success: true, resource: { ...resource.toObject(), isBookmarked } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadResource = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authorized' });
    const { title, description, branch, subject, semester, category, fileType, tags } = req.body;
    const file = req.file;
    const filePath = file ? (file.path || `uploads/resources/${file.filename}`) : null;
    const resource = await Resource.create({
      title: typeof title === 'string' ? { en: title, te: '' } : (title || {}),
      description,
      uploadedBy: req.user._id,
      fileType: fileType || (file ? 'pdf' : 'link'),
      filePath,
      fileName: file ? file.originalname : null,
      fileSize: file ? file.size : null,
      branch,
      subject,
      semester: parseInt(semester, 10),
      category: category || 'notes',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      status: 'pending'
    });
    await gamificationService.awardPoints(req.user._id, 10, 'upload');
    const user = await User.findById(req.user._id);
    if (user.stats) {
      user.stats.contributionsMade = (user.stats.contributionsMade || 0) + 1;
      await user.save();
    }
    res.status(201).json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    if (String(resource.uploadedBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const allowed = ['title', 'description', 'branch', 'subject', 'semester', 'category', 'tags'];
    allowed.forEach(k => { if (req.body[k] !== undefined) resource[k] = req.body[k]; });
    await resource.save();
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    if (String(resource.uploadedBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    if (resource.filePath && fs.existsSync(resource.filePath)) fs.unlinkSync(resource.filePath);
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.searchResources = async (req, res) => {
  try {
    const { q, branch, subject, page = 1, limit = 20 } = req.query;
    const filter = { status: 'approved' };
    if (branch) filter.branch = branch;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (q) {
      filter.$or = [
        { 'title.en': new RegExp(q, 'i') },
        { 'title.te': new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') }
      ];
    }
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const resources = await Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim)
      .populate('uploadedBy', 'name profilePicture');
    const total = await Resource.countDocuments(filter);
    res.json({ success: true, resources, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByBranch = async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'approved', branch: req.params.branch })
      .sort({ createdAt: -1 }).limit(50).populate('uploadedBy', 'name profilePicture');
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBySubject = async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'approved', subject: new RegExp(req.params.subject, 'i') })
      .sort({ createdAt: -1 }).limit(50).populate('uploadedBy', 'name profilePicture');
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBySemester = async (req, res) => {
  try {
    const sem = parseInt(req.params.sem, 10);
    const resources = await Resource.find({ status: 'approved', semester: sem })
      .sort({ createdAt: -1 }).limit(50).populate('uploadedBy', 'name profilePicture');
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || resource.status !== 'approved') return res.status(404).json({ success: false, error: 'Resource not found' });
    if (!resource.filePath || !fs.existsSync(resource.filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.resourcesDownloaded': 1 } });
      const u = await User.findById(req.user._id);
      if (u.stats) {
        u.stats.resourcesDownloaded = (u.stats.resourcesDownloaded || 0) + 1;
        await u.save();
      }
    }
    res.download(resource.filePath, resource.fileName || 'resource');
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.incrementView = async (req, res) => {
  try {
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.rateResource = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    const idx = resource.ratings.findIndex(r => String(r.user) === String(req.user._id));
    const newRating = { user: req.user._id, rating: parseInt(rating, 10), review: review || '', createdAt: new Date() };
    if (idx >= 0) resource.ratings[idx] = newRating;
    else resource.ratings.push(newRating);
    const sum = resource.ratings.reduce((a, r) => a + r.rating, 0);
    resource.averageRating = (sum / resource.ratings.length);
    await resource.save();
    if (resource.averageRating >= 4 && resource.uploadedBy) {
      await gamificationService.awardPoints(resource.uploadedBy, 5, 'rating');
    }
    res.json({ success: true, ratings: resource.ratings, averageRating: resource.averageRating });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRatings = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).select('ratings averageRating')
      .populate('ratings.user', 'name profilePicture');
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, ratings: resource.ratings, averageRating: resource.averageRating });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    resource.comments.push({ user: req.user._id, text: req.body.text, createdAt: new Date() });
    await resource.save();
    const populated = await Resource.findById(resource._id).populate('comments.user', 'name profilePicture');
    res.status(201).json({ success: true, comments: populated.comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).select('comments')
      .populate('comments.user', 'name profilePicture');
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, comments: resource.comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    const id = req.user._id;
    const has = resource.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      resource.bookmarkedBy = resource.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'resource', itemId: resource._id });
    } else {
      resource.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'resource', itemId: resource._id },
        { user: id, itemType: 'resource', itemId: resource._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await resource.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyUploads = async (req, res) => {
  try {
    const resources = await Resource.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarked = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id, itemType: 'resource' })
      .populate('itemId');
    const ids = items.map(i => i.itemId).filter(Boolean);
    const resources = await Resource.find({ _id: { $in: ids }, status: 'approved' })
      .populate('uploadedBy', 'name profilePicture');
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
