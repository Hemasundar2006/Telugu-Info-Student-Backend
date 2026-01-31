const ForumPost = require('../models/ForumPost');
const ForumAnswer = require('../models/ForumAnswer');
const SavedItem = require('../models/SavedItem');
const notificationService = require('../services/notificationService');
const gamificationService = require('../services/gamificationService');
const User = require('../models/User');

exports.getAllPosts = async (req, res) => {
  try {
    const { category, sort = 'recent', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    let query = ForumPost.find(filter);
    if (sort === 'trending') {
      query = query.sort({ upvotes: -1, answerCount: -1, viewCount: -1 });
    } else if (sort === 'unanswered') {
      filter.answerCount = 0;
      query = ForumPost.find(filter).sort({ createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }
    const skip = (parseInt(page, 10) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const lim = Math.min(50, parseInt(limit, 10) || 20);
    const [posts, total] = await Promise.all([
      query.skip(skip).limit(lim).populate('author', 'name profilePicture branch'),
      ForumPost.countDocuments(filter)
    ]);
    res.json({ success: true, posts, total, pages: Math.ceil(total / lim), currentPage: parseInt(page, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id).populate('author', 'name profilePicture branch');
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    await ForumPost.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    post.viewCount += 1;
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags, images, attachments } = req.body;
    const post = await ForumPost.create({
      author: req.user._id,
      title,
      content,
      category: category || 'academic_doubts',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      images: images || [],
      attachments: attachments || (req.files ? req.files.map(f => f.path) : [])
    });
    await gamificationService.awardPoints(req.user._id, 5, 'post');
    const user = await User.findById(req.user._id);
    if (user.stats) {
      user.stats.contributionsMade = (user.stats.contributionsMade || 0) + 1;
      await user.save();
    }
    const populated = await ForumPost.findById(post._id).populate('author', 'name profilePicture branch');
    res.status(201).json({ success: true, post: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const allowed = ['title', 'content', 'category', 'tags'];
    allowed.forEach(k => { if (req.body[k] !== undefined) post[k] = req.body[k]; });
    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    await ForumAnswer.deleteMany({ post: post._id });
    await ForumPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const posts = await ForumPost.find({ category: req.params.cat }).sort({ createdAt: -1 }).limit(50)
      .populate('author', 'name profilePicture branch');
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const posts = await ForumPost.find({}).sort({ upvotes: -1, answerCount: -1 }).limit(20)
      .populate('author', 'name profilePicture branch');
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUnanswered = async (req, res) => {
  try {
    const posts = await ForumPost.find({ answerCount: 0 }).sort({ createdAt: -1 }).limit(50)
      .populate('author', 'name profilePicture branch');
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.upvotePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    const id = req.user._id;
    const upvoted = post.upvotedBy.some(u => String(u) === String(id));
    const downvoted = post.downvotedBy.some(u => String(u) === String(id));
    if (upvoted) {
      post.upvotedBy = post.upvotedBy.filter(u => String(u) !== String(id));
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      post.upvotedBy.push(id);
      post.upvotes += 1;
      if (downvoted) {
        post.downvotedBy = post.downvotedBy.filter(u => String(u) !== String(id));
        post.downvotes = Math.max(0, post.downvotes - 1);
      }
      if (post.author && String(post.author) !== String(id)) {
        await gamificationService.awardPoints(post.author, 2, 'upvote');
      }
    }
    await post.save();
    res.json({ success: true, upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.downvotePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    const id = req.user._id;
    const downvoted = post.downvotedBy.some(u => String(u) === String(id));
    const upvoted = post.upvotedBy.some(u => String(u) === String(id));
    if (downvoted) {
      post.downvotedBy = post.downvotedBy.filter(u => String(u) !== String(id));
      post.downvotes = Math.max(0, post.downvotes - 1);
    } else {
      post.downvotedBy.push(id);
      post.downvotes += 1;
      if (upvoted) {
        post.upvotedBy = post.upvotedBy.filter(u => String(u) !== String(id));
        post.upvotes = Math.max(0, post.upvotes - 1);
      }
    }
    await post.save();
    res.json({ success: true, upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bookmarkPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    const id = req.user._id;
    const has = post.bookmarkedBy.some(b => String(b) === String(id));
    if (has) {
      post.bookmarkedBy = post.bookmarkedBy.filter(b => String(b) !== String(id));
      await SavedItem.deleteOne({ user: id, itemType: 'post', itemId: post._id });
    } else {
      post.bookmarkedBy.push(id);
      await SavedItem.findOneAndUpdate(
        { user: id, itemType: 'post', itemId: post._id },
        { user: id, itemType: 'post', itemId: post._id, savedAt: new Date() },
        { upsert: true }
      );
    }
    await post.save();
    res.json({ success: true, bookmarked: !has });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.reportPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    post.isReported = true;
    post.reportCount = (post.reportCount || 0) + 1;
    await post.save();
    res.json({ success: true, message: 'Reported' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAnswers = async (req, res) => {
  try {
    const answers = await ForumAnswer.find({ post: req.params.id }).sort({ isAccepted: -1, upvotes: -1 })
      .populate('author', 'name profilePicture branch')
      .populate('replies.author', 'name profilePicture');
    res.json({ success: true, answers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.postAnswer = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    const answer = await ForumAnswer.create({
      post: post._id,
      author: req.user._id,
      content: req.body.content,
      images: req.body.images || []
    });
    post.answerCount = (post.answerCount || 0) + 1;
    await post.save();
    await gamificationService.awardPoints(req.user._id, 5, 'answer');
    if (post.author && String(post.author) !== String(req.user._id)) {
      await notificationService.createNotification(post.author, 'community', {
        title: 'New answer on your post',
        message: `Someone answered your post: ${post.title}`,
        relatedId: post._id,
        relatedModel: 'ForumPost',
        actionUrl: `${process.env.CLIENT_URL}/forum/${post._id}`,
        icon: 'comment'
      });
    }
    const populated = await ForumAnswer.findById(answer._id).populate('author', 'name profilePicture branch');
    res.status(201).json({ success: true, answer: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAnswer = async (req, res) => {
  try {
    const answer = await ForumAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });
    if (String(answer.author) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });
    answer.content = req.body.content !== undefined ? req.body.content : answer.content;
    await answer.save();
    res.json({ success: true, answer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await ForumAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });
    if (String(answer.author) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    const post = await ForumPost.findById(answer.post);
    if (post) {
      post.answerCount = Math.max(0, (post.answerCount || 0) - 1);
      await post.save();
    }
    await ForumAnswer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Answer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.upvoteAnswer = async (req, res) => {
  try {
    const answer = await ForumAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });
    const id = req.user._id;
    const has = answer.upvotedBy.some(u => String(u) === String(id));
    if (has) {
      answer.upvotedBy = answer.upvotedBy.filter(u => String(u) !== String(id));
      answer.upvotes = Math.max(0, answer.upvotes - 1);
    } else {
      answer.upvotedBy.push(id);
      answer.upvotes += 1;
    }
    await answer.save();
    res.json({ success: true, upvotes: answer.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.acceptAnswer = async (req, res) => {
  try {
    const answer = await ForumAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });
    const post = await ForumPost.findById(answer.post);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Forbidden' });
    await ForumAnswer.updateMany({ post: post._id }, { isAccepted: false });
    answer.isAccepted = true;
    await answer.save();
    post.isSolved = true;
    await post.save();
    await gamificationService.awardPoints(answer.author, 15, 'accepted');
    const user = await User.findById(answer.author);
    if (user && user.stats) {
      user.stats.helpfulAnswers = (user.stats.helpfulAnswers || 0) + 1;
      await user.save();
    }
    await notificationService.createNotification(answer.author, 'community', {
      title: 'Your answer was accepted!',
      message: `Your answer was marked as the accepted solution.`,
      relatedId: post._id,
      relatedModel: 'ForumPost',
      actionUrl: `${process.env.CLIENT_URL}/forum/${post._id}`,
      icon: 'check'
    });
    res.json({ success: true, answer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.replyToAnswer = async (req, res) => {
  try {
    const answer = await ForumAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });
    answer.replies = answer.replies || [];
    answer.replies.push({ author: req.user._id, content: req.body.content, createdAt: new Date() });
    await answer.save();
    const populated = await ForumAnswer.findById(answer._id).populate('replies.author', 'name profilePicture');
    res.status(201).json({ success: true, replies: populated.replies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await ForumPost.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyAnswers = async (req, res) => {
  try {
    const answers = await ForumAnswer.find({ author: req.user._id }).sort({ createdAt: -1 })
      .populate('post', 'title');
    res.json({ success: true, answers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookmarked = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id, itemType: 'post' });
    const ids = items.map(i => i.itemId).filter(Boolean);
    const posts = await ForumPost.find({ _id: { $in: ids } }).populate('author', 'name profilePicture branch');
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
