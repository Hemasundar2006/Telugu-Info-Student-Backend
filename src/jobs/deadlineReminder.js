const cron = require('node-cron');

let Application;
let notificationService;
try {
  Application = require('../models/Application');
  notificationService = require('../services/notificationService');
} catch (e) {
  console.warn('Cron: modules not loaded yet');
}

// Run daily at 10 AM
cron.schedule('0 10 * * *', async () => {
  if (!Application || !notificationService) return;
  console.log('Running deadline reminder job...');
  try {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const applications = await Application.find({
      reminderSet: true,
      reminderDate: {
        $gte: today,
        $lte: sevenDaysLater
      }
    })
      .populate('job')
      .populate('user');

    for (const app of applications) {
      if (app.job && app.user) {
        const daysLeft = Math.ceil((new Date(app.job.applicationDeadline) - today) / (1000 * 60 * 60 * 24));
        const title = app.job.title && (app.job.title.en || app.job.title) ? (app.job.title.en || app.job.title) : 'Job';

        await notificationService.createNotification(
          app.user._id,
          'reminder',
          {
            title: 'Application Deadline Reminder',
            message: `Only ${daysLeft} days left to apply for ${title}`,
            relatedId: app.job._id,
            relatedModel: 'Job',
            actionUrl: `${process.env.CLIENT_URL || ''}/jobs/${app.job._id}`,
            icon: 'clock'
          }
        );

        app.reminderSet = false;
        await app.save();
      }
    }

    console.log(`Sent ${applications.length} deadline reminders`);
  } catch (error) {
    console.error('Deadline reminder error:', error);
  }
});
