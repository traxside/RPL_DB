const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { sendSuccess, sendError, asyncHandler } = require('../utils');

/**
 * @desc    Create a new payment
 * @route   POST /api/payments
 * @access  Private - Pasien, Admin
 */
exports.createPayment = asyncHandler(async (req, res) => {
  const { 
    order_id, 
    consultation_id, 
    pasien_id, 
    payment_method, 
    insurance_claim_number, 
    insurance_provider, 
    amount 
  } = req.body;

  // Validate at least one of order_id or consultation_id is provided
  if (!order_id && !consultation_id) {
    return sendError(res, 400, 'Either order_id or consultation_id must be provided');
  }

  // Check if the order/consultation exists and belongs to the patient
  if (order_id) {
    const order = await Order.findById(order_id);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }
    
    // If request is from a patient, verify ownership
    if (req.user.role === 'pasien' && order.pasien_id !== pasien_id) {
      return sendError(res, 403, 'You can only make payments for your own orders');
    }
  }

  // Similar check would be needed for consultation_id

  // Create payment
  const payment = await Payment.create({
    order_id,
    consultation_id,
    pasien_id,
    payment_method,
    insurance_claim_number,
    insurance_provider,
    amount,
    status: 'pending'
  });

  sendSuccess(res, 201, 'Payment created successfully', payment);
});

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Private - Admin, Apoteker
 */
exports.getPayments = asyncHandler(async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  const payments = await Payment.getAll(status, parseInt(limit), offset);
  
  sendSuccess(res, 200, 'Payments retrieved successfully', payments);
});

/**
 * @desc    Get patient payments
 * @route   GET /api/payments/patient/:id
 * @access  Private - Pasien (own), Admin
 */
exports.getPatientPayments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 20, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  // If patient is accessing their own records
  if (req.user.role === 'pasien' && req.profile?.id !== id) {
    return sendError(res, 403, 'You can only view your own payment records');
  }

  const payments = await Payment.findByPatientId(id, parseInt(limit), offset);
  
  sendSuccess(res, 200, 'Payments retrieved successfully', payments);
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 * @access  Private - Pasien (own), Admin, Apoteker
 */
exports.getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payment = await Payment.findById(id);
  
  if (!payment) {
    return sendError(res, 404, 'Payment not found');
  }

  // Check if patient is accessing their own payment
  if (req.user.role === 'pasien' && payment.pasien_id !== req.profile?.id) {
    return sendError(res, 403, 'You can only view your own payment records');
  }
  
  sendSuccess(res, 200, 'Payment retrieved successfully', payment);
});

/**
 * @desc    Update payment status
 * @route   PATCH /api/payments/:id/status
 * @access  Private - Admin
 */
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['pending', 'processing', 'completed', 'canceled', 'refunded'].includes(status)) {
    return sendError(res, 400, 'Invalid payment status');
  }
  
  const payment = await Payment.updateStatus(id, status);
  
  if (!payment) {
    return sendError(res, 404, 'Payment not found');
  }
  
  // If payment is completed, update associated order status
  if (status === 'completed' && payment.order_id) {
    await Order.updateStatus(payment.order_id, 'completed');
  }
  
  sendSuccess(res, 200, 'Payment status updated successfully', payment);
});

/**
 * @desc    Process payment
 * @route   POST /api/payments/:id/process
 * @access  Private - Admin
 */
exports.processPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const payment = await Payment.findById(id);
  
  if (!payment) {
    return sendError(res, 404, 'Payment not found');
  }
  
  if (payment.status !== 'pending') {
    return sendError(res, 400, `Payment cannot be processed. Current status: ${payment.status}`);
  }
  
  // Just simulating processing
  
  // Update payment status to completed
  const updatedPayment = await Payment.updateStatus(id, 'completed');
  
  // Update associated order status if applicable
  if (payment.order_id) {
    await Order.updateStatus(payment.order_id, 'completed');
  }
  
  sendSuccess(res, 200, 'Payment processed successfully', updatedPayment);
});

/**
 * @desc    Get payment statistics
 * @route   GET /api/payments/stats
 * @access  Private - Admin
 */
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const stats = await Payment.getStats(startDate, endDate);
  
  sendSuccess(res, 200, 'Payment statistics retrieved successfully', stats);
});

/**
 * @desc    Delete payment
 * @route   DELETE /api/payments/:id
 * @access  Private - Admin
 */
exports.deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deleted = await Payment.delete(id);
  
  if (!deleted) {
    return sendError(res, 404, 'Payment not found');
  }
  
  sendSuccess(res, 200, 'Payment deleted successfully');
});