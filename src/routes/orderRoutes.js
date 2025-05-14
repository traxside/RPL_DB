const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validate } = require('../middleware/validate');
const { 
  createOrderSchema, 
  updateOrderStatusSchema,
  updateOrderItemSchema 
} = require('../utils/validation');
const { authenticate, authorize, loadUserProfile } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(loadUserProfile);

// Get all orders - Admin, Apoteker
router.get(
  '/', 
  authorize('admin', 'apoteker'), 
  orderController.getAllOrders
);

// Get patient orders - Patient (own), Dokter, Admin
router.get(
  '/patient/:id', 
  authorize('pasien', 'dokter', 'admin'), 
  orderController.getPatientOrders
);

// Create new order - Patient, Admin, Dokter
router.post(
  '/', 
  authorize('pasien', 'admin', 'dokter'), 
  validate(createOrderSchema), 
  orderController.createOrder
);

// Get order by ID - Patient (own), Dokter, Admin, Apoteker
router.get(
  '/:id', 
  authorize('pasien', 'dokter', 'admin', 'apoteker'), 
  orderController.getOrderById
);

// Update order status - Admin, Apoteker
router.patch(
  '/:id/status', 
  authorize('admin', 'apoteker'), 
  validate(updateOrderStatusSchema), 
  orderController.updateOrderStatus
);

// Add item to order - Admin, Apoteker
router.post(
  '/:id/items', 
  authorize('admin', 'apoteker'), 
  orderController.addOrderItem
);

// Update order item - Admin, Apoteker
router.patch(
  '/items/:id', 
  authorize('admin', 'apoteker'), 
  validate(updateOrderItemSchema), 
  orderController.updateOrderItem
);

// Remove item from order - Admin, Apoteker
router.delete(
  '/items/:id', 
  authorize('admin', 'apoteker'), 
  orderController.removeOrderItem
);

// Delete order - Admin
router.delete(
  '/:id', 
  authorize('admin'), 
  orderController.deleteOrder
);

module.exports = router;