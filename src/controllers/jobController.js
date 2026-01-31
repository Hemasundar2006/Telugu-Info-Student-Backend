const Job = require('../models/Job');
const Application = require('../models/Application');
const SavedItem = require('../models/SavedItem');
const recommendationService = require('../services/recommendationService');
const notificationService = require('../services/notificationService');

exports.getAllJobs = async (req, res) => {
  try {
    const { jobType, department, state, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true, applicationDeadline: { $gte: new Date() } };
    if (jobType) filter.jobType = jobType;
    if (department) filter.department = department;
    if (state) filter['location.state'] = state;
    if (req.user && req.user.branch) {
      filter.$or = [
        { 'eligibility.branches': req.user.branch },
        { 'eligibility.branches': 'All' },
        { 'eligibility.branches': { $exists: false } }
      ];
    }
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(lim)
        .populate('postedBy', 'name'),
      Job.countDocuments(filter)
    ]);
    res.json({ success: true, jobs, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name');
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    const isBookmarked = req.user && job.bookmarkedBy.some(id => String(id) === String(req.user._id));
    res.json({ success: true, job: { ...job.toObject(), isBookmarked } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    Object.assign(job, req.body);
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.searchJobs = async (req, res) => {
  try {
    const { q, jobType, state, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true, applicationDeadline: { $gte: new Date() } };
    if (jobType) filter.jobType = jobType;
    if (state) filter['location.state'] = state;
    if (q) {
      filter.$or = [
        { 'title.en': new RegExp(q, 'i') },
        { 'company.name': new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') }
      ];
    }
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const jobs = await Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim);
    const total = await Job.countDocuments(filter);
    res.json({ success: true, jobs, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRecommended = async (req, res) => {
  try {
    const jobs = await recommendationService.getRecommendedJobs(req.user._id);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getGovernment = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, jobType: 'government', applicationDeadline: { $gte: new Date() } })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPrivate = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, jobType: 'private', applicationDeadline: { $gte: new Date() } })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getInternships = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, jobType: 'internship', applicationDeadline: { $gte: new Date() } })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWalkins = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, jobType: 'walkin', applicationDeadline: { $gte: new Date() } })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, applicationDeadline: { $gte: new Date() } })
      .sort({ priority: -1, applicationCount: -1, viewCount: -1 }).limit(20);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByLocation = async (req, res) => {
  try {
    const jobs = await Job.find({
      isActive: true,
      'location.state': req.params.state,
      applicationDeadline: { $gte: new Date() }
    }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    const id = req.user._id;
    const has = job.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      job.bookmarkedBy = job.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'job', itemId: job._id });
    } else {
      job.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'job', itemId: job._id },
        { user: id, itemType: 'job', itemId: job._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await job.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.applyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    let app = await Application.findOne({ user: req.user._id, job: job._id });
    if (app) return res.status(400).json({ success: false, error: 'Already applied' });
    app = await Application.create({
      user: req.user._id,
      job: job._id,
      status: 'applied',
      timeline: [{ status: 'applied', date: new Date(), notes: '' }]
    });
    await Job.findByIdAndUpdate(job._id, { $inc: { applicationCount: 1 } });
    await notificationService.createNotification(req.user._id, 'job', {
      title: 'Application recorded',
      message: `You applied for ${job.title.en || job.title}`,
      actionUrl: `${process.env.CLIENT_URL}/jobs/${job._id}`,
      relatedId: job._id,
      relatedModel: 'Job'
    });
    res.status(201).json({ success: true, application: app });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ user: req.user._id })
      .populate('job').sort({ appliedAt: -1 });
    res.json({ success: true, applications: apps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });
    if (status) app.status = status;
    if (notes !== undefined) app.notes = notes;
    app.timeline.push({ status: app.status, date: new Date(), notes: app.notes || '' });
    await app.save();
    res.json({ success: true, application: app });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarked = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id, itemType: 'job' });
    const ids = items.map(i => i.itemId).filter(Boolean);
    const jobs = await Job.find({ _id: { $in: ids }, isActive: true });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.setReminder = async (req, res) => {
  try {
    const { reminderDate } = req.body;
    let app = await Application.findOne({ user: req.user._id, job: req.params.id });
    if (!app) app = await Application.create({ user: req.user._id, job: req.params.id, status: 'applied', timeline: [] });
    app.reminderSet = true;
    app.reminderDate = reminderDate ? new Date(reminderDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await app.save();
    res.json({ success: true, application: app });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
