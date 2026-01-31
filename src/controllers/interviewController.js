const InterviewExperience = require('../models/InterviewExperience');
const Question = require('../models/Question');
const SavedItem = require('../models/SavedItem');
const User = require('../models/User');

exports.getAllExperiences = async (req, res) => {
  try {
    const { company, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (company) filter['company.name'] = new RegExp(company, 'i');
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [experiences, total] = await Promise.all([
      InterviewExperience.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('author.user', 'name branch college'),
      InterviewExperience.countDocuments(filter)
    ]);
    res.json({ success: true, experiences, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExperienceById = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id)
      .populate('author.user', 'name branch college profilePicture')
      .populate('comments.user', 'name profilePicture');
    if (!experience) return res.status(404).json({ success: false, error: 'Experience not found' });
    await InterviewExperience.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name branch college graduationYear');
    const author = {
      user: req.user._id,
      name: user.name,
      branch: user.branch,
      college: user.college?.name || user.college,
      graduationYear: user.graduationYear
    };
    const experience = await InterviewExperience.create({ ...req.body, author });
    res.status(201).json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateExperience = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, error: 'Experience not found' });
    if (String(experience.author.user) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });
    Object.assign(experience, req.body);
    await experience.save();
    res.json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteExperience = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, error: 'Experience not found' });
    if (String(experience.author.user) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });
    await InterviewExperience.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.upvoteExperience = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, error: 'Experience not found' });
    const id = req.user._id;
    const has = experience.upvotedBy.some(u => String(u) === String(id));
    if (has) {
      experience.upvotedBy = experience.upvotedBy.filter(u => String(u) !== String(id));
      experience.upvotes = Math.max(0, experience.upvotes - 1);
    } else {
      experience.upvotedBy.push(id);
      experience.upvotes += 1;
    }
    await experience.save();
    res.json({ success: true, upvotes: experience.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.commentExperience = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, error: 'Experience not found' });
    experience.comments.push({ user: req.user._id, text: req.body.text, createdAt: new Date() });
    await experience.save();
    const populated = await InterviewExperience.findById(experience._id).populate('comments.user', 'name profilePicture');
    res.status(201).json({ success: true, comments: populated.comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const { category, company, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (company) filter.$or = [{ company: new RegExp(company, 'i') }, { askedBy: new RegExp(company, 'i') }];
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('addedBy', 'name'),
      Question.countDocuments(filter)
    ]);
    res.json({ success: true, questions, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('addedBy', 'name');
    if (!question) return res.status(404).json({ success: false, error: 'Question not found' });
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.searchQuestions = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = q ? { $or: [{ question: new RegExp(q, 'i') }, { answer: new RegExp(q, 'i') }, { tags: new RegExp(q, 'i') }] } : {};
    const questions = await Question.find(filter).sort({ createdAt: -1 })
      .skip((parseInt(page, 10) - 1) * (parseInt(limit, 10) || 20))
      .limit(Math.min(50, parseInt(limit, 10) || 20));
    const total = await Question.countDocuments(filter);
    res.json({ success: true, questions, total, pages: Math.ceil(total / (parseInt(limit, 10) || 20)), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.upvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, error: 'Question not found' });
    const id = req.user._id;
    const has = question.upvotedBy.some(u => String(u) === String(id));
    if (has) {
      question.upvotedBy = question.upvotedBy.filter(u => String(u) !== String(id));
      question.upvotes = Math.max(0, question.upvotes - 1);
    } else {
      question.upvotedBy.push(id);
      question.upvotes += 1;
    }
    await question.save();
    res.json({ success: true, upvotes: question.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, error: 'Question not found' });
    const id = req.user._id;
    const has = question.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      question.bookmarkedBy = question.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'post', itemId: question._id });
    } else {
      question.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'post', itemId: question._id },
        { user: id, itemType: 'post', itemId: question._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await question.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarkedQuestions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ids = (user && user._id && await require('../models/Question').find({ bookmarkedBy: req.user._id }).distinct('_id')) || [];
    const questions = await Question.find({ _id: { $in: ids } });
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await InterviewExperience.distinct('company.name');
    res.json({ success: true, companies: companies.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
