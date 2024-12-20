const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import your User model

const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  console.log('Token received:', token); // Log the received token

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Log the decoded token

    // Attach the user information to the request object correctly
    req.user = {
      id: decoded.userId, // Correctly map to userId
      userType: decoded.userType // If you need the userType as well
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
