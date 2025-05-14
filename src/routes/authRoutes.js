const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const { authenticate, loadUserProfile } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { 
  registerUserSchema, 
  loginSchema, 
  updateUserSchema, 
  changePasswordSchema 
} = require('../utils/validation');

// Registration
router.post(
  '/register', 
  validate(registerUserSchema), 
  authController.register
);

// Login
router.post(
  '/login', 
  validate(loginSchema), 
  authController.login
);

// Protected routes - require authentication
router.use(authenticate);
router.use(loadUserProfile);

// Get current user profile
router.get(
  '/me', 
  authController.getMe
);

// Update user profile
router.put(
  '/profile',
  validate(updateUserSchema),
  authController.updateProfile
);

// Change password
router.put(
  '/change-password',
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;