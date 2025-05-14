const Inventory = require('../models/Inventory');
const Obat = require('../models/Obat');
const { sendSuccess, sendError, asyncHandler } = require('../utils');

/**
 * @desc    Add new inventory item
 * @route   POST /api/inventory
 * @access  Private/Admin/Apoteker
 */
exports.addInventoryItem = asyncHandler(async (req, res) => {
  const { obat_id, jumlah, tanggal_kadaluarsa, harga, supplier } = req.body;

  // Verify medication exists
  const obat = await Obat.findById(obat_id);
  if (!obat) {
    return sendError(res, 404, 'Medication not found');
  }

  // Create inventory item
  const inventoryItem = await Inventory.create({
    obat_id,
    jumlah,
    tanggal_kadaluarsa,
    harga,
    supplier
  });

  sendSuccess(res, 201, 'Inventory item added successfully', inventoryItem);
});

/**
 * @desc    Get all inventory items
 * @route   GET /api/inventory
 * @access  Private/Admin/Apoteker
 */
exports.getAllInventory = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const inventory = await Inventory.getAllInventory(limit, offset);

  sendSuccess(res, 200, 'Inventory retrieved successfully', inventory);
});

/**
 * @desc    Get single inventory item
 * @route   GET /api/inventory/:id
 * @access  Private/Admin/Apoteker
 */
exports.getInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inventoryItem = await Inventory.findById(id);
  if (!inventoryItem) {
    return sendError(res, 404, 'Inventory item not found');
  }

  sendSuccess(res, 200, 'Inventory item retrieved successfully', inventoryItem);
});

/**
 * @desc    Update inventory item
 * @route   PUT /api/inventory/:id
 * @access  Private/Admin/Apoteker
 */
exports.updateInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { jumlah, tanggal_kadaluarsa, harga, supplier } = req.body;

  // Check if inventory item exists
  const inventoryExists = await Inventory.findById(id);
  if (!inventoryExists) {
    return sendError(res, 404, 'Inventory item not found');
  }

  // Update inventory item
  const updatedInventory = await Inventory.update(id, {
    jumlah,
    tanggal_kadaluarsa,
    harga,
    supplier
  });

  sendSuccess(res, 200, 'Inventory item updated successfully', updatedInventory);
});

/**
 * @desc    Update inventory stock quantity
 * @route   PATCH /api/inventory/:id/stock
 * @access  Private/Admin/Apoteker
 */
exports.updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantityChange } = req.body;

  if (quantityChange === undefined) {
    return sendError(res, 400, 'Quantity change is required');
  }

  // Check if inventory item exists
  const inventoryExists = await Inventory.findById(id);
  if (!inventoryExists) {
    return sendError(res, 404, 'Inventory item not found');
  }

  // Prevent negative stock
  if (inventoryExists.jumlah + quantityChange < 0) {
    return sendError(res, 400, 'Insufficient stock');
  }

  // Update stock
  const updatedInventory = await Inventory.updateStock(id, quantityChange);

  sendSuccess(res, 200, 'Stock updated successfully', updatedInventory);
});

/**
 * @desc    Delete inventory item
 * @route   DELETE /api/inventory/:id
 * @access  Private/Admin/Apoteker
 */
exports.deleteInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if inventory item exists
  const inventoryExists = await Inventory.findById(id);
  if (!inventoryExists) {
    return sendError(res, 404, 'Inventory item not found');
  }

  // Delete inventory item
  await Inventory.delete(id);

  sendSuccess(res, 200, 'Inventory item deleted successfully');
});

/**
 * @desc    Get low stock items
 * @route   GET /api/inventory/low-stock
 * @access  Private/Admin/Apoteker
 */
exports.getLowStock = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;

  const lowStockItems = await Inventory.getLowStock(threshold);

  sendSuccess(res, 200, 'Low stock items retrieved successfully', lowStockItems);
});

/**
 * @desc    Get expiring soon items
 * @route   GET /api/inventory/expiring-soon
 * @access  Private/Admin/Apoteker
 */
exports.getExpiringSoon = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;

  const expiringSoonItems = await Inventory.getExpiringSoon(days);

  sendSuccess(res, 200, 'Expiring soon items retrieved successfully', expiringSoonItems);
});

/**
 * @desc    Get inventory by medication ID
 * @route   GET /api/inventory/medication/:id
 * @access  Private/Admin/Apoteker
 */
exports.getInventoryByMedication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify medication exists
  const obat = await Obat.findById(id);
  if (!obat) {
    return sendError(res, 404, 'Medication not found');
  }

  const inventoryItems = await Inventory.findByMedicationId(id);

  sendSuccess(res, 200, 'Inventory items retrieved successfully', inventoryItems);
});