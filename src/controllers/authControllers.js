const User = require('../models/User');
const Pasien = require('../models/Pasien');
const Dokter = require('../models/Dokter');
const Admin = require('../models/Admin');
const Apoteker = require('../models/Apoteker');
const { generateToken, sendSuccess, sendError, asyncHandler } = require('../utils');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { role } = req.body;

  // Check if email is already in use
  const existingUser = await User.findByEmail(req.body.email);
  if (existingUser) {
    return sendError(res, 400, 'Email already in use');
  }

  // Create user
  const user = await User.create(req.body);

  // Create role-specific profile
  let profile;
  switch (role) {
    case 'pasien':
      profile = await Pasien.create({
        user_id: user.id,
        gender: req.body.gender,
        status: req.body.status || 'active',
        alamat: req.body.alamat,
        emergency_contact: req.body.emergency_contact,
        blood_type: req.body.blood_type,
        riwayat_penyakit: req.body.riwayat_penyakit,
        obat_dikonsumsi: req.body.obat_dikonsumsi
      });
      break;
    case 'dokter':
      profile = await Dokter.create({
        user_id: user.id,
        spesialisasi: req.body.spesialisasi,
        jadwal: req.body.jadwal || {}
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
      return sendError(res, 400, 'Invalid role specified');
  }

  // Generate JWT token
  const token = generateToken(user);

  return sendSuccess(res, 201, 'User registered successfully', {
    user,
    profile,
    token
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
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

  // Load profile based on role
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

  // Generate JWT token
  const token = generateToken(user);

  return sendSuccess(res, 200, 'Login successful', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role
    },
    profile,
    token
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Get profile based on role
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

  return sendSuccess(res, 200, 'User profile retrieved successfully', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      created_at: user.created_at
    },
    profile
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  // Update user data
  const updatedUser = await User.update(req.user.id, req.body);
  
  if (!updatedUser) {
    return sendError(res, 404, 'User not found');
  }
  
  // Update role-specific profile if needed
  if (req.profile && req.body.profile) {
    let updatedProfile;
    
    switch (req.user.role) {
      case 'pasien':
        updatedProfile = await Pasien.update(req.profile.id, req.body.profile);
        break;
      case 'dokter':
        updatedProfile = await Dokter.update(req.profile.id, req.body.profile);
        break;
      case 'admin':
        updatedProfile = await Admin.update(req.profile.id, req.body.profile);
        break;
      case 'apoteker':
        updatedProfile = await Apoteker.update(req.profile.id, req.body.profile);
        break;
    }
    
    return sendSuccess(res, 200, 'Profile updated successfully', {
      user: updatedUser,
      profile: updatedProfile
    });
  }
  
  return sendSuccess(res, 200, 'User updated successfully', { user: updatedUser });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findByEmail(req.user.email);
  
  if (!user) {
    return sendError(res, 404, 'User not found');
  }
  
  // Verify current password
  const isMatch = await User.verifyPassword(user, currentPassword);
  if (!isMatch) {
    return sendError(res, 401, 'Current password is incorrect');
  }
  
  // Update password
  await User.updatePassword(user.id, newPassword);
  
  return sendSuccess(res, 200, 'Password changed successfully');
});