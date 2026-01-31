const User = require('../models/User');
const notificationService = require('./notificationService');

const BADGE_CRITERIA = {
  EARLY_ADOPTER: { field: 'createdAt', condition: (user) => new Date(user.createdAt) < new Date('2026-03-01') },
  TOP_CONTRIBUTOR: { field: 'contributionsMade', threshold: 50 },
  HELPFUL_MEMBER: { field: 'helpfulAnswers', threshold: 100 },
  BOOKWORM: { field: 'resourcesDownloaded', threshold: 100 }
};

exports.awardPoints = async (userId, points, reason) => {
  const user = await User.findById(userId);
  if (!user) return 0;
  if (!user.stats) user.stats = { resourcesDownloaded: 0, contributionsMade: 0, helpfulAnswers: 0, points: 0 };
  user.stats.points = (user.stats.points || 0) + points;
  await user.save();
  await exports.checkAndAwardBadges(userId);
  return user.stats.points;
};

exports.checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;
  const earnedBadgeNames = (user.badges || []).map(b => b.name);

  for (const [badgeName, criteria] of Object.entries(BADGE_CRITERIA)) {
    if (earnedBadgeNames.includes(badgeName)) continue;
    let eligible = false;
    if (criteria.condition) {
      eligible = criteria.condition(user);
    } else if (criteria.threshold && user.stats && user.stats[criteria.field] !== undefined) {
      eligible = user.stats[criteria.field] >= criteria.threshold;
    }
    if (eligible) {
      if (!user.badges) user.badges = [];
      user.badges.push({
        name: badgeName,
        icon: `badge-${badgeName.toLowerCase()}.png`,
        earnedAt: new Date()
      });
      await user.save();
      try {
        await notificationService.createNotification(userId, 'system', {
          title: 'New Badge Earned!',
          message: `Congratulations! You've earned the ${badgeName} badge.`,
          icon: 'trophy'
        });
      } catch (e) {
        console.error('Badge notification error:', e);
      }
    }
  }
};
