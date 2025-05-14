
const express = require('express');
const router = express.Router();
const { 
  createMedicalRecord, 
  getMedicalRecord, 
  getPatientMedicalRecords, 
  getDoctorMedicalRecords, 
  updateMedicalRecord, 
  deleteMedicalRecord 
} = require('../controllers/medicalRecordController');
const { authenticate, authorize, loadUserProfile } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// Create a new medical record - doctor only
router.post('/', authorize('dokter'), createMedicalRecord);

// Get medical record by ID - doctor or patient (with restrictions)
router.get('/:id', authorize('dokter', 'pasien'), getMedicalRecord);

// Get medical records by patient - doctor or patient (with restrictions)
router.get('/patient/:patientId', authorize('dokter', 'pasien'), getPatientMedicalRecords);

// Get medical records by doctor - doctor only
router.get('/doctor', authorize('dokter'), getDoctorMedicalRecords);

// Update medical record - doctor only
router.put('/:id', authorize('dokter'), updateMedicalRecord);

// Delete medical record - doctor only
router.delete('/:id', authorize('dokter'), deleteMedicalRecord);

module.exports = router;