const User = require('../models/User');
const Job = require('../models/Job');
const Course = require('../models/Course');

exports.getRecommendedJobs = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const jobs = await Job.find({
    isActive: true,
    applicationDeadline: { $gte: new Date() },
    $or: [
      { 'eligibility.branches': user.branch },
      { 'eligibility.branches': 'All' },
      { 'eligibility.branches': { $exists: false } }
    ]
  }).lean();

  const scoredJobs = jobs.map(job => {
    let score = 0;
    const branches = (job.eligibility && job.eligibility.branches) || [];
    if (user.branch && branches.includes(user.branch)) score += 50;
    if (user.college && user.college.location && job.location && job.location.state === user.college.location) score += 30;
    const daysSincePosted = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePosted <= 7) score += 20;
    if (job.isFeatured) score += 40;
    score += (job.priority || 0);
    return { job, score };
  });

  scoredJobs.sort((a, b) => b.score - a.score);
  return scoredJobs.slice(0, 20).map(item => item.job);
};

exports.getRecommendedCourses = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const query = { isActive: true };
  if (user.branch) query.$or = [{ recommendedFor: user.branch }, { tags: { $in: user.interests || [] } }];
  const courses = await Course.find(query).limit(20).lean();
  return courses;
};
