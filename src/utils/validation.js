const Joi = require('joi');

// User validation schemas
const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  phone_number: Joi.string().max(20),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('pasien', 'dokter', 'admin', 'apoteker').required(),
  
  // Pasien specific fields
  gender: Joi.string().valid('male', 'female', 'other').when('role', {
    is: 'pasien',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  status: Joi.string().when('role', {
    is: 'pasien',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  alamat: Joi.string().when('role', {
    is: 'pasien',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  emergency_contact: Joi.string().when('role', {
    is: 'pasien',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  blood_type: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').when('role', {
    is: 'pasien',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  riwayat_penyakit: Joi.string().when('role', {
    is: 'pasien',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  obat_dikonsumsi: Joi.string().when('role', {
    is: 'pasien',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  
  // Dokter specific fields
  spesialisasi: Joi.string().when('role', {
    is: 'dokter',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  jadwal: Joi.object().when('role', {
    is: 'dokter',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  phone_number: Joi.string().max(20),
  email: Joi.string().email()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Confirm password must match new password' })
});

// Pasien validation schemas
const updatePasienSchema = Joi.object({
  gender: Joi.string().valid('male', 'female', 'other'),
  status: Joi.string(),
  alamat: Joi.string(),
  emergency_contact: Joi.string(),
  blood_type: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  riwayat_penyakit: Joi.string(),
  obat_dikonsumsi: Joi.string()
});

// Order validation schemas
const createOrderSchema = Joi.object({
  pasien_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  items: Joi.array().items(
    Joi.object({
      obat_id: Joi.string().guid({ version: 'uuidv4' }).required(),
      quantity: Joi.number().integer().min(1).required(),
      unit_price: Joi.number().precision(2).min(0).required()
    })
  ).min(1).required()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'canceled').required()
});

// OrderItem validation schema
const updateOrderItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().precision(2).min(0).required()
});

module.exports = {
  registerUserSchema,
  loginSchema,
  updateUserSchema,
  changePasswordSchema,
  updatePasienSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  updateOrderItemSchema
};