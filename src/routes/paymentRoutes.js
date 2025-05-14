const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize, loadUserProfile } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

// Payment validation schema
const createPaymentSchema = Joi.object({
  order_id: Joi.string().guid({ version: 'uuidv4' }),
  consultation_id: Joi.string().guid({ version: 'uuidv4' }),
  pasien_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  payment_method: Joi.string().required(),
  insurance_claim_number: Joi.string(),
  insurance_provider: Joi.string(),
  amount: Joi.number().precision(2).min(0).required()
}).or('order_id', 'consultation_id');

const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'canceled', 'refunded').required()
});

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(loadUserProfile);

// Get all payments - Admin, Apoteker
router.get(
  '/', 
  authorize('admin', 'apoteker'), 
  paymentController.getPayments
);

// Get payment statistics - Admin
router.get(
  '/stats', 
  authorize('admin'), 
  paymentController.getPaymentStats
);

// Get patient payments - Patient (own), Admin
router.get(
  '/patient/:id', 
  authorize('pasien', 'admin'), 
  paymentController.getPatientPayments
);

// Create new payment - Patient, Admin
router.post(
  '/', 
  authorize('pasien', 'admin'), 
  validate(createPaymentSchema), 
  paymentController.createPayment
);

// Get payment by ID - Patient (own), Admin, Apoteker
router.get(
  '/:id', 
  authorize('pasien', 'admin', 'apoteker'), 
  paymentController.getPaymentById
);

// Update payment status - Admin
router.patch(
  '/:id/status', 
  authorize('admin'), 
  validate(updatePaymentStatusSchema), 
  paymentController.updatePaymentStatus
);

// Process payment - Admin
router.post(
  '/:id/process', 
  authorize('admin'), 
  paymentController.processPayment
);

// Delete payment - Admin
router.delete(
  '/:id', 
  authorize('admin'), 
  paymentController.deletePayment
);

module.exports = router;