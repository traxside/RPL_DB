const Obat = require('../models/Obat');
const Inventory = require('../models/Inventory');
const { sendSuccess, sendError, asyncHandler } = require('../utils');

// @desc    Create a new medication
// @route   POST /api/medications
// @access  Private/Admin/Apoteker
exports.createMedication = asyncHandler(async (req, res) => {
  const { nama, kategori, manufacturer, dosis, deskripsi, efek_samping } = req.body;

  // Create medication
  const medication = await Obat.create({
    nama,
    kategori,
    manufacturer,
    dosis,
    deskripsi,
    efek_samping
  });

  return sendSuccess(res, 201, 'Medication created successfully', { medication });
});

// @desc    Get all medications
// @route   GET /api/medications
// @access  Private
exports.getMedications = asyncHandler(async (req, res) => {
  const { limit = 100, offset = 0, category = null } = req.query;
  
  const medications = await Obat.getAllMedications(
    parseInt(limit),
    parseInt(offset),
    category
  );
  
  return sendSuccess(res, 200, 'Medications retrieved successfully', { medications });
});

// @desc    Get medication by id
// @route   GET /api/medications/:id
// @access  Private
exports.getMedicationById = asyncHandler(async (req, res) => {
  const medication = await Obat.findById(req.params.id);
  
  if (!medication) {
    return sendError(res, 404, 'Medication not found');
  }
  
  // Get inventory information if it exists
  let inventory = null;
  if (req.user.role === 'admin' || req.user.role === 'apoteker') {
    inventory = await Inventory.findByObatId(medication.id);
  }
  
  return sendSuccess(res, 200, 'Medication retrieved successfully', { 
    medication,
    inventory: inventory || undefined
  });
});

// @desc    Search medications by name
// @route   GET /api/medications/search
// @access  Private
exports.searchMedications = asyncHandler(async (req, res) => {
  const { name } = req.query;
  
  if (!name || name.trim() === '') {
    return sendError(res, 400, 'Search query is required');
  }
  
  const medications = await Obat.findByName(name);
  
  return sendSuccess(res, 200, 'Search results retrieved successfully', { medications });
});

// @desc    Get medication categories
// @route   GET /api/medications/categories
// @access  Private
exports.getMedicationCategories = asyncHandler(async (req, res) => {
  const categories = await Obat.getCategories();
  
  return sendSuccess(res, 200, 'Medication categories retrieved successfully', { categories });
});

// @desc    Update a medication
// @route   PUT /api/medications/:id
// @access  Private/Admin/Apoteker
exports.updateMedication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if medication exists
  const existingMedication = await Obat.findById(id);
  if (!existingMedication) {
    return sendError(res, 404, 'Medication not found');
  }
  
  // Update the medication
  const updatedMedication = await Obat.update(id, req.body);
  
  return sendSuccess(res, 200, 'Medication updated successfully', { medication: updatedMedication });
});

// @desc    Delete a medication
// @route   DELETE /api/medications/:id
// @access  Private/Admin
exports.deleteMedication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if medication exists
  const existingMedication = await Obat.findById(id);
  if (!existingMedication) {
    return sendError(res, 404, 'Medication not found');
  }
  
  // Check if medication is in inventory
  const inventory = await Inventory.findByObatId(id);
  if (inventory && inventory.jumlah > 0) {
    return sendError(res, 400, 'Cannot delete medication with existing inventory');
  }
  
  // Delete the medication
  await Obat.delete(id);
  
  return sendSuccess(res, 200, 'Medication deleted successfully');
});

// @desc    Add medication to inventory
// @route   POST /api/medications/:id/inventory
// @access  Private/Admin/Apoteker
exports.addToInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { jumlah, tanggal_kadaluarsa, harga, supplier } = req.body;
  
  // Check if medication exists
  const medication = await Obat.findById(id);
  if (!medication) {
    return sendError(res, 404, 'Medication not found');
  }
  
  // Check if inventory already exists for this medication
  let inventoryItem = await Inventory.findByObatId(id);
  
  if (inventoryItem) {
    // Update existing inventory
    inventoryItem = await Inventory.update(inventoryItem.id, {
      jumlah: inventoryItem.jumlah + parseInt(jumlah),
      tanggal_kadaluarsa: tanggal_kadaluarsa || inventoryItem.tanggal_kadaluarsa,
      harga: harga || inventoryItem.harga,
      supplier: supplier || inventoryItem.supplier
    });
  } else {
    // Create new inventory
    inventoryItem = await Inventory.create({
      obat_id: id,
      jumlah: parseInt(jumlah),
      tanggal_kadaluarsa,
      harga,
      supplier
    });
  }
  
  return sendSuccess(res, 200, 'Inventory updated successfully', { inventory: inventoryItem });
});

// @desc    Update medication inventory
// @route   PUT /api/medications/:id/inventory
// @access  Private/Admin/Apoteker
exports.updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if medication exists
  const medication = await Obat.findById(id);
  if (!medication) {
    return sendError(res, 404, 'Medication not found');
  }
  
  // Check if inventory exists
  const inventoryItem = await Inventory.findByObatId(id);
  if (!inventoryItem) {
    return sendError(res, 404, 'Inventory not found for this medication');
  }
  
  // Update inventory
  const updatedInventory = await Inventory.update(inventoryItem.id, req.body);
  
  return sendSuccess(res, 200, 'Inventory updated successfully', { inventory: updatedInventory });
});