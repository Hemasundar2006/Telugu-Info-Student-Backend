const TechNews = require('../models/TechNews');
const SavedItem = require('../models/SavedItem');
const { calculateReadTime } = require('../utils/helpers');

exports.getAllNews = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [news, total] = await Promise.all([
      TechNews.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(lim),
      TechNews.countDocuments(filter)
    ]);
    res.json({ success: true, news, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const article = await TechNews.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    await TechNews.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    article.views += 1;
    if (!article.readTime && article.content) article.readTime = calculateReadTime(article.content);
    res.json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const news = await TechNews.find({ isActive: true, category: req.params.cat }).limit(50);
    res.json({ success: true, news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.incrementView = async (req, res) => {
  try {
    await TechNews.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkNews = async (req, res) => {
  try {
    const article = await TechNews.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    const id = req.user._id;
    const has = article.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      article.bookmarkedBy = article.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'link', itemId: article._id });
    } else {
      article.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'link', itemId: article._id },
        { user: id, itemType: 'link', itemId: article._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await article.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarked = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id, itemType: 'link' });
    const ids = items.map(i => i.itemId).filter(Boolean);
    const news = await TechNews.find({ _id: { $in: ids }, isActive: true });
    res.json({ success: true, news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
