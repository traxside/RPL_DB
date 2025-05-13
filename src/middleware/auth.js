const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pasien = require('../models/Pasien');
const Dokter = require('../models/Dokter');
const Admin = require('../models/Admin');
const Apoteker = require('../models/Apoteker');

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized. You do not have permission to access this resource.' 
      });
    }
    
    next();
  };
};

// Load user profile based on role
exports.loadUserProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }
    
    let profile;
    switch (req.user.role) {
      case 'pasien':
        profile = await Pasien.findByUserId(req.user.id);
        break;
      case 'dokter':
        profile = await Dokter.findByUserId(req.user.id);
        break;
      case 'admin':
        profile = await Admin.findByUserId(req.user.id);
        break;
      case 'apoteker':
        profile = await Apoteker.findByUserId(req.user.id);
        break;
    }
    
    if (profile) {
      req.profile = profile;
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error loading user profile.', 
      error: error.message 
    });
  }
};

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Not found middleware
exports.notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};