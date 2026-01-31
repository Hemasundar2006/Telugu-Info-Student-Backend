const Notification = require('../models/Notification');
const User = require('../models/User');

let getIO;
try {
  const socketServer = require('../socket/socketServer');
  getIO = () => socketServer.getIO && socketServer.getIO();
} catch (e) {
  getIO = () => null;
}

exports.createNotification = async (userId, type, data) => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const notification = await Notification.create({
    recipient: userId,
    type,
    title: data.title || 'Notification',
    message: data.message || '',
    data: data.payload || {},
    relatedId: data.relatedId,
    relatedModel: data.relatedModel,
    icon: data.icon,
    actionUrl: data.actionUrl,
    expiresAt
  });

  const io = getIO();
  if (io) {
    try {
      io.to(userId.toString()).emit('notification', notification);
    } catch (e) {
      console.error('Socket emit error:', e);
    }
  }

  const user = await User.findById(userId);
  if (user && user.notificationPreferences && user.notificationPreferences.email && type === 'job' && data.actionUrl) {
    try {
      const emailService = require('./emailService');
      await emailService.sendEmail({
        email: user.email,
        subject: data.title,
        html: `<p>${data.message}</p>${data.actionUrl ? `<a href="${data.actionUrl}">View Details</a>` : ''}`
      });
    } catch (e) {
      console.error('Notification email error:', e);
    }
  }

  return notification;
};
