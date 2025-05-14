const MedicalRecord = require('../models/MedicalRecord');
const Pasien = require('../models/Pasien');
const { sendSuccess, sendError, asyncHandler } = require('../utils');

// @desc    Create a new medical record
// @route   POST /api/medical-records
// @access  Private/Dokter
exports.createMedicalRecord = asyncHandler(async (req, res) => {
  const { 
    pasien_id, heartrate, tension, blood_sugar, 
    diagnosis, symptoms, notes, treatment_plan, record_date
  } = req.body;

  // Check if patient exists
  const patient = await Pasien.findById(pasien_id);
  if (!patient) {
    return sendError(res, 404, 'Patient not found');
  }

  // Create medical record
  const medicalRecord = await MedicalRecord.create({
    pasien_id,
    dokter_id: req.profile.id, // Get doctor id from authenticated user profile
    heartrate,
    tension,
    blood_sugar,
    diagnosis,
    symptoms,
    notes,
    treatment_plan,
    record_date: record_date || new Date().toISOString().split('T')[0] // Use current date if not provided
  });

  return sendSuccess(res, 201, 'Medical record created successfully', { medicalRecord });
});

// @desc    Get medical record by id
// @route   GET /api/medical-records/:id
// @access  Private/Dokter/Pasien
exports.getMedicalRecord = asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id);

  if (!medicalRecord) {
    return sendError(res, 404, 'Medical record not found');
  }

  // Check if user is authorized to access this record
  if (req.user.role === 'pasien' && medicalRecord.pasien_id !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to access this medical record');
  }

  return sendSuccess(res, 200, 'Medical record retrieved successfully', { medicalRecord });
});

// @desc    Get medical records by patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private/Dokter/Pasien
exports.getPatientMedicalRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  // Check if patient exists
  const patient = await Pasien.findById(patientId);
  if (!patient) {
    return sendError(res, 404, 'Patient not found');
  }

  // Check if user is authorized to access these records
  if (req.user.role === 'pasien' && patientId !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to access these medical records');
  }

  const medicalRecords = await MedicalRecord.findByPatientId(patientId, parseInt(limit), parseInt(offset));

  return sendSuccess(res, 200, 'Medical records retrieved successfully', { medicalRecords });
});

// @desc    Get medical records by doctor
// @route   GET /api/medical-records/doctor
// @access  Private/Dokter
exports.getDoctorMedicalRecords = asyncHandler(async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  
  const medicalRecords = await MedicalRecord.findByDoctorId(req.profile.id, parseInt(limit), parseInt(offset));
  
  return sendSuccess(res, 200, 'Medical records retrieved successfully', { medicalRecords });
});

// @desc    Update a medical record
// @route   PUT /api/medical-records/:id
// @access  Private/Dokter
exports.updateMedicalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if medical record exists
  const existingRecord = await MedicalRecord.findById(id);
  if (!existingRecord) {
    return sendError(res, 404, 'Medical record not found');
  }
  
  // Check if doctor is authorized to update this record
  if (existingRecord.dokter_id !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to update this medical record');
  }
  
  // Update the medical record
  const updatedRecord = await MedicalRecord.update(id, req.body);
  
  return sendSuccess(res, 200, 'Medical record updated successfully', { medicalRecord: updatedRecord });
});

// @desc    Delete a medical record
// @route   DELETE /api/medical-records/:id
// @access  Private/Dokter
exports.deleteMedicalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if medical record exists
  const existingRecord = await MedicalRecord.findById(id);
  if (!existingRecord) {
    return sendError(res, 404, 'Medical record not found');
  }
  
  // Check if doctor is authorized to delete this record
  if (existingRecord.dokter_id !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to delete this medical record');
  }
  
  // Delete the medical record
  await MedicalRecord.delete(id);
  
  return sendSuccess(res, 200, 'Medical record deleted successfully');
});