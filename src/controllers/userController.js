const User = require('../models/User');
const Pasien = require('../models/Pasien');
const Dokter = require('../models/Dokter');
const Admin = require('../models/Admin');
const Apoteker = require('../models/Apoteker');
const { generateToken, sendSuccess, sendError, asyncHandler } = require('../utils');
const bcrypt = require('bcrypt');

/**
 * @desc    Register new user
 * @route   POST /api/users/register
 * @access  Public
 */
exports.registerUser = asyncHandler(async (req, res) => {
  const { 
    name, phone_number, email, password, role,
    // Pasien specific fields
    gender, status, alamat, emergency_contact, blood_type, riwayat_penyakit, obat_dikonsumsi,
    // Dokter specific fields
    spesialisasi, jadwal
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return sendError(res, 400, 'Email already registered');
  }

  // Create user
  const user = await User.create({
    name,
    phone_number,
    email,
    password,
    role
  });

  // Create role-specific profile
  let profile;
  switch (role) {
    case 'pasien':
      profile = await Pasien.create({
        user_id: user.id,
        gender,
        status: status || 'active',
        alamat,
        emergency_contact,
        blood_type,
        riwayat_penyakit,
        obat_dikonsumsi
      });
      break;
    case 'dokter':
      profile = await Dokter.create({
        user_id: user.id,
        spesialisasi,
        jadwal
      });
      break;
    case 'admin':
      profile = await Admin.create({
        user_id: user.id
      });
      break;
    case 'apoteker':
      profile = await Apoteker.create({
        user_id: user.id
      });
      break;
    default:
      return sendError(res, 400, 'Invalid role');
  }

  // Generate token
  const token = generateToken(user);

  sendSuccess(res, 201, 'User registered successfully', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    profile,
    token
  });
});

/**
 * @desc    Login user
 * @route   POST /api/users/login
 * @access  Public
 */
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findByEmail(email);
  if (!user) {
    return sendError(res, 401, 'Invalid credentials');
  }

  // Verify password
  const isMatch = await User.verifyPassword(user, password);
  if (!isMatch) {
    return sendError(res, 401, 'Invalid credentials');
  }

  // Generate token
  const token = generateToken(user);

  // Get user profile based on role
  let profile;
  switch (user.role) {
    case 'pasien':
      profile = await Pasien.findByUserId(user.id);
      break;
    case 'dokter':
      profile = await Dokter.findByUserId(user.id);
      break;
    case 'admin':
      profile = await Admin.findByUserId(user.id);
      break;
    case 'apoteker':
      profile = await Apoteker.findByUserId(user.id);
      break;
  }

  sendSuccess(res, 200, 'Login successful', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    profile,
    token
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    phone_number: req.user.phone_number,
    role: req.user.role
  };

  sendSuccess(res, 200, 'User profile retrieved successfully', {
    user,
    profile: req.profile || null
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone_number, email } = req.body;

  // Update user
  const updatedUser = await User.update(req.user.id, {
    name,
    phone_number,
    email
  });

  // Update role-specific profile if data provided
  let updatedProfile = null;
  if (req.profile) {
    switch (req.user.role) {
      case 'pasien':
        const {
          gender, status, alamat, emergency_contact, 
          blood_type, riwayat_penyakit, obat_dikonsumsi
        } = req.body;
        
        if (gender || status || alamat || emergency_contact || 
            blood_type || riwayat_penyakit || obat_dikonsumsi) {
          updatedProfile = await Pasien.update(req.profile.id, {
            gender,
            status,
            alamat,
            emergency_contact,
            blood_type,
            riwayat_penyakit,
            obat_dikonsumsi
          });
        }
        break;
      case 'dokter':
        const { spesialisasi, jadwal } = req.body;
        if (spesialisasi || jadwal) {
          updatedProfile = await Dokter.update(req.profile.id, {
            spesialisasi,
            jadwal: jadwal ? (typeof jadwal === 'string' ? jadwal : JSON.stringify(jadwal)) : undefined
          });
        }
        break;
      // No specific fields for admin and apoteker to update
    }
  }

  sendSuccess(res, 200, 'User profile updated successfully', {
    user: updatedUser,
    profile: updatedProfile || req.profile
  });
});

/**
 * @desc    Change user password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findByEmail(req.user.email);
  
  // Verify current password
  const isMatch = await User.verifyPassword(user, currentPassword);
  if (!isMatch) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  // Update password
  await User.updatePassword(user.id, newPassword);

  sendSuccess(res, 200, 'Password updated successfully');
});

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  // This would require a method in User model to fetch all users
  // For now, we'll just return a message
  sendSuccess(res, 200, 'User list endpoint', {
    message: 'This endpoint would return a list of users - implementation needed in User model'
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    return sendError(res, 404, 'User not found');
  }
  
  // Delete user
  await User.delete(id);
  
  sendSuccess(res, 200, 'User deleted successfully');
});