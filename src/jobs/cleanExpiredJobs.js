const cron = require('node-cron');
const mongoose = require('mongoose');

let Job;
let Notification;
try {
  Job = require('../models/Job');
  Notification = require('../models/Notification');
} catch (e) {
  console.warn('Cron: models not loaded yet');
}

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  if (!Job || !Notification) return;
  console.log('Running daily cleanup job...');
  try {
    const expiredJobs = await Job.updateMany(
      {
        applicationDeadline: { $lt: new Date() },
        isActive: true
      },
      { isActive: false }
    );
    console.log(`Marked ${expiredJobs.modifiedCount} jobs as inactive`);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldNotifications = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    console.log(`Deleted ${oldNotifications.deletedCount} old notifications`);
  } catch (error) {
    console.error('Cleanup job error:', error);
  }
});
