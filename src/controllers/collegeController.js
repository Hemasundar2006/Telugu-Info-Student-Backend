const College = require('../models/College');

exports.getAllColleges = async (req, res) => {
  try {
    const { state, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (state) filter['location.state'] = state;
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [colleges, total] = await Promise.all([
      College.find(filter).sort({ name: 1 }).skip(skip).limit(lim),
      College.countDocuments(filter)
    ]);
    res.json({ success: true, colleges, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ success: false, error: 'College not found' });
    res.json({ success: true, college });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.searchColleges = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { shortName: new RegExp(q, 'i') }, { university: new RegExp(q, 'i') }] } : {};
    const colleges = await College.find(filter).sort({ name: 1 })
      .skip((parseInt(page, 10) - 1) * (parseInt(limit, 10) || 20))
      .limit(Math.min(50, parseInt(limit, 10) || 20));
    const total = await College.countDocuments(filter);
    res.json({ success: true, colleges, total, pages: Math.ceil(total / (parseInt(limit, 10) || 20)), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByState = async (req, res) => {
  try {
    const colleges = await College.find({ 'location.state': req.params.state }).sort({ name: 1 }).limit(100);
    res.json({ success: true, colleges });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCollege = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    const college = await College.create(req.body);
    res.status(201).json({ success: true, college });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
