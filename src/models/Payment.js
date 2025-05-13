const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Order {
  static async create({ pasien_id, total_harga, status = 'pending' }) {
    const result = await db.query(
      `INSERT INTO "Order" (pasien_id, total_harga, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [pasien_id, total_harga, status]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT o.*, u.name as pasien_name
       FROM "Order" o
       JOIN "Pasien" p ON o.pasien_id = p.id
       JOIN "User" u ON p.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const order = result.rows[0];
    
    // Get order items
    const itemsResult = await db.query(
      `SELECT oi.*, ob.nama as obat_nama
       FROM "OrderItem" oi
       JOIN "Obat" ob ON oi.obat_id = ob.id
       WHERE oi.order_id = $1`,
      [id]
    );
    
    order.items = itemsResult.rows;
    return order;
  }

  static async findByPatientId(patientId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT o.*
       FROM "Order" o
       WHERE o.pasien_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );
    return result.rows;
  }

  static async getAllOrders(status = null, limit = 100, offset = 0) {
    let query = `
      SELECT o.*, u.name as pasien_name
      FROM "Order" o
      JOIN "Pasien" p ON o.pasien_id = p.id
      JOIN "User" u ON p.user_id = u.id
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE o.status = $3`;
      params.push(status);
    }
    
    query += `
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset, ...params]);
    return result.rows;
  }

  static async addOrderItem({ order_id, obat_id, quantity, unit_price }) {
    const subtotal = quantity * unit_price;
    
    const result = await db.query(
      `INSERT INTO "OrderItem" (order_id, obat_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [order_id, obat_id, quantity, unit_price, subtotal]
    );
    
    // Update order total
    await db.query(
      `UPDATE "Order"
       SET total_harga = (
         SELECT SUM(subtotal) FROM "OrderItem" WHERE order_id = $1
       )
       WHERE id = $1`,
      [order_id]
    );
    
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE "Order"
       SET status = $2
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );
    return result.rows[0];
  }

  static async delete(id) {
    // This will also delete OrderItems due to CASCADE constraint
    await db.query(`DELETE FROM "Order" WHERE id = $1`, [id]);
    return true;
  }

  static async getOrderItemsByOrderId(orderId) {
    const result = await db.query(
      `SELECT oi.*, ob.nama as obat_nama
       FROM "OrderItem" oi
       JOIN "Obat" ob ON oi.obat_id = ob.id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  }
}

module.exports = Order;