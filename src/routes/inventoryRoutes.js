// TODO
const express = require('express');
const router = express.Router();
const { 
  addInventoryItem, 
  getAllInventory, 
  getInventoryItem, 
  updateInventoryItem, 
  updateStock, 
  deleteInventoryItem, 
  getLowStock, 
  getExpiringSoon,
  getInventoryByMedication
} = require('../controllers/inventoryController');
const { authenticate, authorize, loadUserProfile } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// Admin and Apoteker only routes
router.use(authorize('admin', 'apoteker'));

// Add new inventory item
router.post('/', addInventoryItem);

// Get all inventory items
router.get('/', getAllInventory);

// Get low stock items
router.get('/low-stock', getLowStock);

// Get expiring soon items
router.get('/expiring-soon', getExpiringSoon);

// Get inventory by medication ID
router.get('/medication/:id', getInventoryByMedication);

// Get single inventory item
router.get('/:id', getInventoryItem);

// Update inventory item
router.put('/:id', updateInventoryItem);

// Update stock quantity
router.patch('/:id/stock', updateStock);

// Delete inventory item
router.delete('/:id', deleteInventoryItem);

module.exports = router;