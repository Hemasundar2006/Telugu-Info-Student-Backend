const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const path = require('path');

require('dotenv').config();

const connectDB = require('./src/config/db');
const socketServer = require('./src/socket/socketServer');
const { errorHandler } = require('./src/middleware/errorHandler');
const { limitRequests } = require('./src/middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

socketServer.init(server);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limitRequests(100, 15 * 60 * 1000));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB().then(() => {
  console.log('Database connected');
}).catch(err => {
  console.error('Database connection failed:', err);
});

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/resources', require('./src/routes/resources'));
app.use('/api/jobs', require('./src/routes/jobs'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/interviews', require('./src/routes/interviews'));
app.use('/api/links', require('./src/routes/links'));
app.use('/api/forum', require('./src/routes/forum'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/money-tips', require('./src/routes/moneyTips'));
app.use('/api/tech-news', require('./src/routes/techNews'));
app.use('/api/colleges', require('./src/routes/colleges'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use(errorHandler);

require('./src/jobs/cleanExpiredJobs');
require('./src/jobs/deadlineReminder');

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
