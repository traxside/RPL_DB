const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { authenticate, authorize, loadUserProfile } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

// Validation schema for consultation
const consultationSchema = Joi.object({
  pasien_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  dokter_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  consultation_date: Joi.date().iso().required(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled', 'rescheduled')
});

const consultationStatusSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'completed', 'cancelled', 'rescheduled').required()
});

const consultationResultsSchema = Joi.object({
  hasil_konsultasi: Joi.string().required()
});

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(loadUserProfile);

// Get all consultations - Admin only
router.get(
  '/',
  authorize('admin'),
  consultationController.getAllConsultations
);

// Get upcoming consultations - Admin only
router.get(
  '/upcoming',
  authorize('admin'),
  consultationController.getUpcomingConsultations
);

// Get doctor's upcoming consultations - Admin, Doctor
router.get(
  '/doctor/:id/upcoming',
  authorize('admin', 'dokter'),
  consultationController.getDoctorUpcomingConsultations
);

// Get patient's upcoming consultations - Admin, Doctor, Patient
router.get(
  '/patient/:id/upcoming',
  authorize('admin', 'dokter', 'pasien'),
  consultationController.getPatientUpcomingConsultations
);

// Create consultation - Admin, Doctor, Patient
router.post(
  '/',
  authorize('admin', 'dokter', 'pasien'),
  validate(consultationSchema),
  consultationController.createConsultation
);

// Get consultation by ID - Admin, involved Doctor, involved Patient
router.get(
  '/:id',
  authorize('admin', 'dokter', 'pasien'),
  consultationController.getConsultationById
);

// Update consultation - Admin, involved Doctor
router.put(
  '/:id',
  authorize('admin', 'dokter'),
  consultationController.updateConsultation
);

// Update consultation status - Admin, involved Doctor
router.put(
  '/:id/status',
  authorize('admin', 'dokter'),
  validate(consultationStatusSchema),
  consultationController.updateConsultationStatus
);

// Add consultation results - involved Doctor
router.put(
  '/:id/hasil',
  authorize('dokter'),
  validate(consultationResultsSchema),
  consultationController.addConsultationResults
);

// Delete consultation - Admin only
router.delete(
  '/:id',
  authorize('admin'),
  consultationController.deleteConsultation
);

module.exports = router;