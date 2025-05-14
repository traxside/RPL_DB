const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Inventory = require('../models/Inventory');
const { sendSuccess, sendError, asyncHandler } = require('../utils');

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private - Pasien, Admin, Dokter
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const { pasien_id, items } = req.body;
  
  // If request is from a patient, ensure they're creating their own order
  if (req.user.role === 'pasien' && req.profile?.id !== pasien_id) {
    return sendError(res, 403, 'You can only create orders for yourself');
  }
  
  // Calculate initial total price (will be updated as items are added)
  const initialTotal = 0;
  
  // Create the order
  const order = await Order.create({
    pasien_id,
    total_harga: initialTotal,
    status: 'pending'
  });
  
  // Add items to the order
  const orderItems = [];
  
  for (const item of items) {
    const { obat_id, quantity, unit_price } = item;
    
    // Check inventory
    const inventory = await Inventory.findByObatId(obat_id);
    
    if (!inventory || inventory.jumlah < quantity) {
      // Roll back the order if not enough stock
      await Order.delete(order.id);
      return sendError(res, 400, `Not enough stock for medication with ID: ${obat_id}`);
    }
    
    // Add item to order
    const orderItem = await OrderItem.create({
      order_id: order.id,
      obat_id,
      quantity,
      unit_price
    });
    
    // Update inventory (reduce stock)
    await Inventory.updateStock(inventory.id, inventory.jumlah - quantity);
    
    orderItems.push(orderItem);
  }
  
  // Get the updated order with correct total
  const updatedOrder = await Order.findById(order.id);
  
  sendSuccess(res, 201, 'Order created successfully', {
    ...updatedOrder,
    items: orderItems
  });
});

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Private - Admin, Apoteker
 */
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;
  const offset = (page - 1) * limit;
  
  const orders = await Order.getAllOrders(status, parseInt(limit), offset);
  
  sendSuccess(res, 200, 'Orders retrieved successfully', orders);
});

/**
 * @desc    Get orders by patient ID
 * @route   GET /api/orders/patient/:id
 * @access  Private - Pasien (own), Dokter, Admin
 */
exports.getPatientOrders = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 20, page = 1 } = req.query;
  const offset = (page - 1) * limit;
  
  // If patient is accessing their own records
  if (req.user.role === 'pasien' && req.profile?.id !== id) {
    return sendError(res, 403, 'You can only view your own orders');
  }
  
  const orders = await Order.findByPatientId(id, parseInt(limit), offset);
  
  sendSuccess(res, 200, 'Patient orders retrieved successfully', orders);
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private - Pasien (own), Dokter, Admin, Apoteker
 */
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id);
  
  if (!order) {
    return sendError(res, 404, 'Order not found');
  }
  
  // If patient is accessing their own order
  if (req.user.role === 'pasien' && order.pasien_id !== req.profile?.id) {
    return sendError(res, 403, 'You can only view your own orders');
  }
  
  sendSuccess(res, 200, 'Order retrieved successfully', order);
});

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id/status
 * @access  Private - Admin, Apoteker
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['pending', 'processing', 'completed', 'canceled'].includes(status)) {
    return sendError(res, 400, 'Invalid order status');
  }
  
  const order = await Order.findById(id);
  
  if (!order) {
    return sendError(res, 404, 'Order not found');
  }
  
  // If order is being canceled, return items to inventory
  if (status === 'canceled' && order.status !== 'canceled') {
    const orderItems = await Order.getOrderItemsByOrderId(id);
    
    for (const item of orderItems) {
      const inventory = await Inventory.findByObatId(item.obat_id);
      if (inventory) {
        await Inventory.updateStock(inventory.id, inventory.jumlah + item.quantity);
      }
    }
  }
  
  const updatedOrder = await Order.updateStatus(id, status);
  
  sendSuccess(res, 200, 'Order status updated successfully', updatedOrder);
});

/**
 * @desc    Add item to order
 * @route   POST /api/orders/:id/items
 * @access  Private - Admin, Apoteker
 */
exports.addOrderItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { obat_id, quantity, unit_price } = req.body;
  
  const order = await Order.findById(id);
  
  if (!order) {
    return sendError(res, 404, 'Order not found');
  }
  
  if (order.status !== 'pending') {
    return sendError(res, 400, 'Can only add items to pending orders');
  }
  
  // Check inventory
  const inventory = await Inventory.findByObatId(obat_id);
  
  if (!inventory || inventory.jumlah < quantity) {
    return sendError(res, 400, 'Not enough stock for this medication');
  }
  
  // Add item to order
  const orderItem = await OrderItem.create({
    order_id: id,
    obat_id,
    quantity,
    unit_price
  });
  
  // Update inventory (reduce stock)
  await Inventory.updateStock(inventory.id, inventory.jumlah - quantity);
  
  sendSuccess(res, 201, 'Item added to order successfully', orderItem);
});

/**
 * @desc    Update order item
 * @route   PATCH /api/orders/items/:id
 * @access  Private - Admin, Apoteker
 */
exports.updateOrderItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, unit_price } = req.body;
  
  const orderItem = await OrderItem.findById(id);
  
  if (!orderItem) {
    return sendError(res, 404, 'Order item not found');
  }
  
  const order = await Order.findById(orderItem.order_id);
  
  if (order.status !== 'pending') {
    return sendError(res, 400, 'Can only update items in pending orders');
  }
  
  // Check if quantity is increased and verify inventory
  if (quantity > orderItem.quantity) {
    const additionalQuantity = quantity - orderItem.quantity;
    const inventory = await Inventory.findByObatId(orderItem.obat_id);
    
    if (!inventory || inventory.jumlah < additionalQuantity) {
      return sendError(res, 400, 'Not enough stock for this medication');
    }
    
    // Update inventory (reduce additional stock)
    await Inventory.updateStock(inventory.id, inventory.jumlah - additionalQuantity);
  } 
  // If quantity is decreased, return items to inventory
  else if (quantity < orderItem.quantity) {
    const returnedQuantity = orderItem.quantity - quantity;
    const inventory = await Inventory.findByObatId(orderItem.obat_id);
    
    if (inventory) {
      await Inventory.updateStock(inventory.id, inventory.jumlah + returnedQuantity);
    }
  }
  
  // Update order item
  const updatedOrderItem = await OrderItem.update(id, { quantity, unit_price });
  
  sendSuccess(res, 200, 'Order item updated successfully', updatedOrderItem);
});

/**
 * @desc    Remove item from order
 * @route   DELETE /api/orders/items/:id
 * @access  Private - Admin, Apoteker
 */
exports.removeOrderItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const orderItem = await OrderItem.findById(id);
  
  if (!orderItem) {
    return sendError(res, 404, 'Order item not found');
  }
  
  const order = await Order.findById(orderItem.order_id);
  
  if (order.status !== 'pending') {
    return sendError(res, 400, 'Can only remove items from pending orders');
  }
  
  // Return quantity to inventory
  const inventory = await Inventory.findByObatId(orderItem.obat_id);
  if (inventory) {
    await Inventory.updateStock(inventory.id, inventory.jumlah + orderItem.quantity);
  }
  
  // Delete the order item
  await OrderItem.delete(id);
  
  sendSuccess(res, 200, 'Item removed from order successfully');
});

/**
 * @desc    Delete order
 * @route   DELETE /api/orders/:id
 * @access  Private - Admin
 */
exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id);
  
  if (!order) {
    return sendError(res, 404, 'Order not found');
  }
  
  // Return all items to inventory if order is not completed
  if (order.status !== 'completed') {
    const orderItems = await Order.getOrderItemsByOrderId(id);
    
    for (const item of orderItems) {
      const inventory = await Inventory.findByObatId(item.obat_id);
      if (inventory) {
        await Inventory.updateStock(inventory.id, inventory.jumlah + item.quantity);
      }
    }
  }
  
  // Delete the order (will cascade delete order items)
  await Order.delete(id);
  
  sendSuccess(res, 200, 'Order deleted successfully');
});