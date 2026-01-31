const Course = require('../models/Course');
const SavedItem = require('../models/SavedItem');
const recommendationService = require('../services/recommendationService');

exports.getAllCourses = async (req, res) => {
  try {
    const { category, difficulty, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Course.countDocuments(filter)
    ]);
    res.json({ success: true, courses, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const isBookmarked = req.user && course.bookmarkedBy.some(id => String(id) === String(req.user._id));
    res.json({ success: true, course: { ...course.toObject(), isBookmarked } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.searchCourses = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }, { tags: new RegExp(q, 'i') }];
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const courses = await Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim);
    const total = await Course.countDocuments(filter);
    res.json({ success: true, courses, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRecommended = async (req, res) => {
  try {
    const courses = await recommendationService.getRecommendedCourses(req.user._id);
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true, category: req.params.category }).limit(50);
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const id = req.user._id;
    const has = course.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      course.bookmarkedBy = course.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'course', itemId: course._id });
    } else {
      course.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'course', itemId: course._id },
        { user: id, itemType: 'course', itemId: course._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await course.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const exists = course.enrolledBy && course.enrolledBy.some(e => String(e.user) === String(req.user._id));
    if (exists) return res.status(400).json({ success: false, error: 'Already enrolled' });
    if (!course.enrolledBy) course.enrolledBy = [];
    course.enrolledBy.push({ user: req.user._id, enrolledAt: new Date(), progress: 0, completed: false });
    await course.save();
    res.json({ success: true, message: 'Enrolled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { progress, completed } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const entry = course.enrolledBy && course.enrolledBy.find(e => String(e.user) === String(req.user._id));
    if (!entry) return res.status(400).json({ success: false, error: 'Not enrolled' });
    entry.progress = progress !== undefined ? Math.min(100, progress) : entry.progress;
    entry.completed = completed !== undefined ? completed : entry.completed;
    await course.save();
    res.json({ success: true, progress: entry.progress, completed: entry.completed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getEnrolled = async (req, res) => {
  try {
    const courses = await Course.find({ 'enrolledBy.user': req.user._id });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarked = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id, itemType: 'course' });
    const ids = items.map(i => i.itemId).filter(Boolean);
    const courses = await Course.find({ _id: { $in: ids }, isActive: true });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
