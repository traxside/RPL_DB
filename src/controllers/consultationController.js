const Consultation = require('../models/Consultation');
const Pasien = require('../models/Pasien');
const Dokter = require('../models/Dokter');
const { sendSuccess, sendError, asyncHandler } = require('../utils');

/**
 * @desc    Get all consultations
 * @route   GET /api/consultations
 * @access  Private (Admin)
 */
exports.getAllConsultations = asyncHandler(async (req, res) => {
  const consultations = await Consultation.findAll();
  
  sendSuccess(res, 200, 'Successfully retrieved all consultations', consultations);
});

/**
 * @desc    Get single consultation by ID
 * @route   GET /api/consultations/:id
 * @access  Private (Admin, Doctor, Patient involved)
 */
exports.getConsultationById = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id);
  
  if (!consultation) {
    return sendError(res, 404, 'Consultation not found');
  }
  
  // Authorization check - only admin, involved doctor or patient can access
  if (req.user.role === 'dokter' && req.profile.id !== consultation.dokter_id) {
    return sendError(res, 403, 'Not authorized to view this consultation');
  }
  
  if (req.user.role === 'pasien' && req.profile.id !== consultation.pasien_id) {
    return sendError(res, 403, 'Not authorized to view this consultation');
  }
  
  sendSuccess(res, 200, 'Successfully retrieved consultation', consultation);
});

/**
 * @desc    Create new consultation
 * @route   POST /api/consultations
 * @access  Private (Admin, Doctor, Patient)
 */
exports.createConsultation = asyncHandler(async (req, res) => {
  const { pasien_id, dokter_id, consultation_date } = req.body;
  
  // Check if patient exists
  const pasien = await Pasien.findById(pasien_id);
  if (!pasien) {
    return sendError(res, 404, 'Patient not found');
  }
  
  // Check if doctor exists
  const dokter = await Dokter.findById(dokter_id);
  if (!dokter) {
    return sendError(res, 404, 'Doctor not found');
  }
  
  // Authorization check for patients
  if (req.user.role === 'pasien' && req.profile.id !== pasien_id) {
    return sendError(res, 403, 'Not authorized to create consultation for another patient');
  }
  
  // Create consultation
  const consultationData = {
    pasien_id,
    dokter_id,
    consultation_date,
    status: 'scheduled'
  };
  
  const consultation = await Consultation.create(consultationData);
  
  sendSuccess(res, 201, 'Consultation scheduled successfully', consultation);
});

/**
 * @desc    Update consultation
 * @route   PUT /api/consultations/:id
 * @access  Private (Admin, Doctor involved)
 */
exports.updateConsultation = asyncHandler(async (req, res) => {
  let consultation = await Consultation.findById(req.params.id);
  
  if (!consultation) {
    return sendError(res, 404, 'Consultation not found');
  }
  
  // Authorization check - only admin or involved doctor can update
  if (req.user.role === 'dokter' && req.profile.id !== consultation.dokter_id) {
    return sendError(res, 403, 'Not authorized to update this consultation');
  }
  
  consultation = await Consultation.update(req.params.id, req.body);
  
  sendSuccess(res, 200, 'Consultation updated successfully', consultation);
});

/**
 * @desc    Delete consultation
 * @route   DELETE /api/consultations/:id
 * @access  Private (Admin)
 */
exports.deleteConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id);
  
  if (!consultation) {
    return sendError(res, 404, 'Consultation not found');
  }
  
  await Consultation.delete(req.params.id);
  
  sendSuccess(res, 200, 'Consultation deleted successfully');
});

/**
 * @desc    Update consultation status
 * @route   PUT /api/consultations/:id/status
 * @access  Private (Admin, Doctor involved)
 */
exports.updateConsultationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['scheduled', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
    return sendError(res, 400, 'Invalid status. Must be scheduled, completed, cancelled, or rescheduled');
  }
  
  let consultation = await Consultation.findById(req.params.id);
  
  if (!consultation) {
    return sendError(res, 404, 'Consultation not found');
  }
  
  // Authorization check - only admin or involved doctor can update status
  if (req.user.role === 'dokter' && req.profile.id !== consultation.dokter_id) {
    return sendError(res, 403, 'Not authorized to update this consultation status');
  }
  
  consultation = await Consultation.updateStatus(req.params.id, status);
  
  sendSuccess(res, 200, 'Consultation status updated successfully', consultation);
});

/**
 * @desc    Add consultation results
 * @route   PUT /api/consultations/:id/hasil
 * @access  Private (Doctor involved)
 */
exports.addConsultationResults = asyncHandler(async (req, res) => {
  const { hasil_konsultasi } = req.body;
  
  let consultation = await Consultation.findById(req.params.id);
  
  if (!consultation) {
    return sendError(res, 404, 'Consultation not found');
  }
  
  // Authorization check - only involved doctor can add results
  if (req.user.role === 'dokter' && req.profile.id !== consultation.dokter_id) {
    return sendError(res, 403, 'Not authorized to update this consultation results');
  }
  
  consultation = await Consultation.addResults(req.params.id, hasil_konsultasi);
  
  // Also update status to completed
  consultation = await Consultation.updateStatus(req.params.id, 'completed');
  
  sendSuccess(res, 200, 'Consultation results added successfully', consultation);
});

/**
 * @desc    Get upcoming consultations
 * @route   GET /api/consultations/upcoming
 * @access  Private (Admin)
 */
exports.getUpcomingConsultations = asyncHandler(async (req, res) => {
  const consultations = await Consultation.findUpcoming();
  
  sendSuccess(res, 200, 'Successfully retrieved upcoming consultations', consultations);
});

/**
 * @desc    Get doctor's upcoming consultations
 * @route   GET /api/consultations/doctor/:id/upcoming
 * @access  Private (Admin, Doctor)
 */
exports.getDoctorUpcomingConsultations = asyncHandler(async (req, res) => {
  const doctorId = req.params.id;
  
  // Authorization check
  if (req.user.role === 'dokter' && req.profile.id !== doctorId) {
    return sendError(res, 403, 'Not authorized to view this doctor\'s consultations');
  }
  
  const consultations = await Consultation.findDoctorUpcoming(doctorId);
  
  sendSuccess(res, 200, 'Successfully retrieved doctor\'s upcoming consultations', consultations);
});

/**
 * @desc    Get patient's upcoming consultations
 * @route   GET /api/consultations/patient/:id/upcoming
 * @access  Private (Admin, Doctor, Patient)
 */
exports.getPatientUpcomingConsultations = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  
  // Authorization check
  if (req.user.role === 'pasien' && req.profile.id !== patientId) {
    return sendError(res, 403, 'Not authorized to view this patient\'s consultations');
  }
  
  const consultations = await Consultation.findPatientUpcoming(patientId);
  
  sendSuccess(res, 200, 'Successfully retrieved patient\'s upcoming consultations', consultations);
});