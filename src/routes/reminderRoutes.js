const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authenticate, authorize, loadUserProfile } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

// Validation schemas
const reminderSchema = Joi.object({
  pasien_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  obat_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  reminder_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().required(),
  status: Joi.string().valid('active', 'completed', 'paused', 'cancelled')
});

const reminderStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'completed', 'paused', 'cancelled').required()
});

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(loadUserProfile);

// Create a new medication reminder - Patient, Doctor
router.post(
  '/', 
  authorize('pasien', 'dokter'), 
  validate(reminderSchema), 
  reminderController.createReminder
);

// Get all reminders for a patient - Patient, Doctor
router.get(
  '/', 
  authorize('pasien', 'dokter'), 
  reminderController.getReminders
);

// Get a specific reminder - Patient, Doctor
router.get(
  '/:id', 
  authorize('pasien', 'dokter'), 
  reminderController.getReminder
);

// Update a reminder - Patient, Doctor
router.put(
  '/:id', 
  authorize('pasien', 'dokter'), 
  reminderController.updateReminder
);

// Update reminder status - Patient, Doctor
router.patch(
  '/:id/status', 
  authorize('pasien', 'dokter'), 
  validate(reminderStatusSchema), 
  reminderController.updateReminderStatus
);

// Delete a reminder - Patient, Doctor
router.delete(
  '/:id', 
  authorize('pasien', 'dokter'), 
  reminderController.deleteReminder
);

module.exports = router;