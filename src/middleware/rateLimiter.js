const rateLimit = {};

exports.limitRequests = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimit[ip]) {
      rateLimit[ip] = { count: 1, resetTime: now + windowMs };
    } else if (now > rateLimit[ip].resetTime) {
      rateLimit[ip] = { count: 1, resetTime: now + windowMs };
    } else {
      rateLimit[ip].count++;
      if (rateLimit[ip].count > maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later'
        });
      }
    }

    next();
  };
};
