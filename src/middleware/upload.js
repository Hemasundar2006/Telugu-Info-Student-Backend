const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dirs = ['uploads/resources', 'uploads/profiles', 'uploads/forum', 'uploads/jobs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const getDestination = (req) => {
  const baseUrl = (req.baseUrl || '') + (req.path || '');
  if (baseUrl.includes('resources')) return 'uploads/resources/';
  if (baseUrl.includes('users') || baseUrl.includes('profile')) return 'uploads/profiles/';
  if (baseUrl.includes('forum')) return 'uploads/forum/';
  if (baseUrl.includes('jobs')) return 'uploads/jobs/';
  return 'uploads/';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getDestination(req));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const allowedMimes = /pdf|jpeg|jpg|png|gif|doc|docx|ppt|pptx/;
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimetype = (file.mimetype || '').toLowerCase();
  const ok = allowedMimes.test(ext) || /pdf|jpeg|jpg|png|gif|msword|vnd\.openxmlformats|vnd\.ms-powerpoint/.test(mimetype);
  if (ok) return cb(null, true);
  cb(new Error('Invalid file type. Only PDF, images, and documents allowed.'));
};

exports.uploadSingleFile = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024 },
  fileFilter
}).single('file');

exports.uploadMultipleFiles = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).array('files', 5);

const profileStorage = multer.diskStorage({
  destination: 'uploads/profiles/',
  filename: (req, file, cb) => {
    const uid = req.user ? req.user._id.toString() : Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uid}${ext}`);
  }
});

exports.uploadProfilePicture = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpeg', '.jpg', '.png'].includes(ext)) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png) allowed'));
  }
}).single('profilePicture');
