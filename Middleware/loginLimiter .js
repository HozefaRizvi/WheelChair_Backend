const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 30 * 1000, 
    max: 5, 
    message: { msg: 'Too many login attempts. Please try again later.' },
  });

  module.exports = loginLimiter;