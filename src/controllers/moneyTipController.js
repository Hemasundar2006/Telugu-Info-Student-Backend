const MoneySavingTip = require('../models/MoneySavingTip');
const SavedItem = require('../models/SavedItem');

exports.getAllTips = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [tips, total] = await Promise.all([
      MoneySavingTip.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      MoneySavingTip.countDocuments(filter)
    ]);
    res.json({ success: true, tips, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTipById = async (req, res) => {
  try {
    const tip = await MoneySavingTip.findById(req.params.id);
    if (!tip) return res.status(404).json({ success: false, error: 'Tip not found' });
    res.json({ success: true, tip });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const tips = await MoneySavingTip.find({ isActive: true, category: req.params.cat }).limit(50);
    res.json({ success: true, tips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkTip = async (req, res) => {
  try {
    const tip = await MoneySavingTip.findById(req.params.id);
    if (!tip) return res.status(404).json({ success: false, error: 'Tip not found' });
    const id = req.user._id;
    const has = tip.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      tip.bookmarkedBy = tip.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'link', itemId: tip._id });
    } else {
      tip.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'link', itemId: tip._id },
        { user: id, itemType: 'link', itemId: tip._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await tip.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.upvoteTip = async (req, res) => {
  try {
    const tip = await MoneySavingTip.findById(req.params.id);
    if (!tip) return res.status(404).json({ success: false, error: 'Tip not found' });
    tip.upvotes = (tip.upvotes || 0) + 1;
    await tip.save();
    res.json({ success: true, upvotes: tip.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarked = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id, itemType: 'link' });
    const ids = items.map(i => i.itemId).filter(Boolean);
    const tips = await MoneySavingTip.find({ _id: { $in: ids }, isActive: true });
    res.json({ success: true, tips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
