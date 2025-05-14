// TODO
const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  changePassword,
  getAllUsers,
  deleteUser
} = require('../controllers/userController');
const { authenticate, authorize, loadUserProfile } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { 
  registerUserSchema, 
  loginSchema, 
  updateUserSchema, 
  changePasswordSchema 
} = require('../utils/validation');

// Public routes
router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Protected routes
router.use(authenticate);
router.use(loadUserProfile);

router.get('/profile', getUserProfile);
router.put('/profile', validate(updateUserSchema), updateUserProfile);
router.put('/change-password', validate(changePasswordSchema), changePassword);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;