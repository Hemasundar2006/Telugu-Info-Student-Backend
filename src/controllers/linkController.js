const ImportantLink = require('../models/ImportantLink');
const SavedItem = require('../models/SavedItem');

exports.getAllLinks = async (req, res) => {
  try {
    const { category, state, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (state) filter.state = state;
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [links, total] = await Promise.all([
      ImportantLink.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      ImportantLink.countDocuments(filter)
    ]);
    res.json({ success: true, links, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLinkById = async (req, res) => {
  try {
    const link = await ImportantLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    res.json({ success: true, link });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createLink = async (req, res) => {
  try {
    const link = await ImportantLink.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, link });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateLink = async (req, res) => {
  try {
    const link = await ImportantLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    Object.assign(link, req.body);
    await link.save();
    res.json({ success: true, link });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteLink = async (req, res) => {
  try {
    const link = await ImportantLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    await ImportantLink.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const links = await ImportantLink.find({ isActive: true, category: req.params.category }).limit(50);
    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByState = async (req, res) => {
  try {
    const links = await ImportantLink.find({ isActive: true, state: req.params.state }).limit(50);
    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.trackClick = async (req, res) => {
  try {
    await ImportantLink.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkLink = async (req, res) => {
  try {
    const link = await ImportantLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    const id = req.user._id;
    const has = link.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      link.bookmarkedBy = link.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'link', itemId: link._id });
    } else {
      link.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'link', itemId: link._id },
        { user: id, itemType: 'link', itemId: link._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await link.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarked = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id, itemType: 'link' });
    const ids = items.map(i => i.itemId).filter(Boolean);
    const links = await ImportantLink.find({ _id: { $in: ids }, isActive: true });
    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyLink = async (req, res) => {
  try {
    const link = await ImportantLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    link.lastVerified = new Date();
    link.verifiedBy = req.user._id;
    await link.save();
    res.json({ success: true, link });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
