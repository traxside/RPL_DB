const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const consultationRoutes = require('./consultationRoutes');
const medicalRecordRoutes = require('./medicalRecordRoutes');
const reminderRoutes = require('./reminderRoutes');
const obatRoutes = require('./obatRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');

// Define API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/consultations', consultationRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/reminders', reminderRoutes);
router.use('/obat', obatRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

// If no routes match
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

module.exports = router;