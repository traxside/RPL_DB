const Reminder = require('../models/Reminder');
const Obat = require('../models/Obat');
const Pasien = require('../models/Pasien');
const { sendSuccess, sendError, asyncHandler } = require('../utils');

// @desc    Create a new medication reminder
// @route   POST /api/reminders
// @access  Private/Pasien/Dokter
exports.createReminder = asyncHandler(async (req, res) => {
  const { pasien_id, obat_id, reminder_time, dosage, frequency, status } = req.body;

  // Validation for patient access
  if (req.user.role === 'pasien' && pasien_id !== req.profile.id) {
    return sendError(res, 403, 'You can only create reminders for yourself');
  }

  // Check if patient exists
  const patient = await Pasien.findById(pasien_id);
  if (!patient) {
    return sendError(res, 404, 'Patient not found');
  }

  // Check if medication exists
  const medication = await Obat.findById(obat_id);
  if (!medication) {
    return sendError(res, 404, 'Medication not found');
  }

  // Create reminder
  const reminder = await Reminder.create({
    pasien_id,
    obat_id,
    reminder_time,
    dosage,
    frequency,
    status: status || 'active'
  });

  return sendSuccess(res, 201, 'Medication reminder created successfully', { 
    reminder,
    medication: {
      id: medication.id,
      nama: medication.nama,
      dosis: medication.dosis
    }
  });
});

// @desc    Get all reminders for a patient
// @route   GET /api/reminders
// @access  Private/Pasien/Dokter
exports.getReminders = asyncHandler(async (req, res) => {
  let patientId;
  
  // Determine which patient's reminders to retrieve
  if (req.user.role === 'pasien') {
    patientId = req.profile.id;
  } else if (req.user.role === 'dokter' && req.query.patientId) {
    patientId = req.query.patientId;
    
    // Verify patient exists
    const patient = await Pasien.findById(patientId);
    if (!patient) {
      return sendError(res, 404, 'Patient not found');
    }
  } else if (req.user.role === 'dokter') {
    return sendError(res, 400, 'Patient ID is required');
  }
  
  // Get active or all reminders
  const reminders = req.query.status === 'all' 
    ? await Reminder.findByPatientId(patientId)
    : await Reminder.findActiveByPatientId(patientId);
  
  return sendSuccess(res, 200, 'Reminders retrieved successfully', { reminders });
});

// @desc    Get a specific reminder
// @route   GET /api/reminders/:id
// @access  Private/Pasien/Dokter
exports.getReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  
  if (!reminder) {
    return sendError(res, 404, 'Reminder not found');
  }
  
  // Check if user is authorized to access this reminder
  if (req.user.role === 'pasien' && reminder.pasien_id !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to access this reminder');
  }
  
  return sendSuccess(res, 200, 'Reminder retrieved successfully', { reminder });
});

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private/Pasien/Dokter
exports.updateReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if reminder exists
  const existingReminder = await Reminder.findById(id);
  if (!existingReminder) {
    return sendError(res, 404, 'Reminder not found');
  }
  
  // Check if user is authorized to update this reminder
  if (req.user.role === 'pasien' && existingReminder.pasien_id !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to update this reminder');
  }
  
  // Update the reminder
  const updatedReminder = await Reminder.update(id, req.body);
  
  return sendSuccess(res, 200, 'Reminder updated successfully', { reminder: updatedReminder });
});

// @desc    Update reminder status
// @route   PATCH /api/reminders/:id/status
// @access  Private/Pasien/Dokter
exports.updateReminderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['active', 'completed', 'paused', 'cancelled'].includes(status)) {
    return sendError(res, 400, 'Valid status is required');
  }
  
  // Check if reminder exists
  const existingReminder = await Reminder.findById(id);
  if (!existingReminder) {
    return sendError(res, 404, 'Reminder not found');
  }
  
  // Check if user is authorized to update this reminder
  if (req.user.role === 'pasien' && existingReminder.pasien_id !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to update this reminder');
  }
  
  // Update the reminder status
  const updatedReminder = await Reminder.updateStatus(id, status);
  
  return sendSuccess(res, 200, 'Reminder status updated successfully', { reminder: updatedReminder });
});

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private/Pasien/Dokter
exports.deleteReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if reminder exists
  const existingReminder = await Reminder.findById(id);
  if (!existingReminder) {
    return sendError(res, 404, 'Reminder not found');
  }
  
  // Check if user is authorized to delete this reminder
  if (req.user.role === 'pasien' && existingReminder.pasien_id !== req.profile.id) {
    return sendError(res, 403, 'Not authorized to delete this reminder');
  }
  
  // Delete the reminder
  await Reminder.delete(id);
  
  return sendSuccess(res, 200, 'Reminder deleted successfully');
});