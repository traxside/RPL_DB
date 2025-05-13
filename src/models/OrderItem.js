const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class OrderItem {
  static async create({ order_id, obat_id, quantity, unit_price }) {
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

  static async findById(id) {
    const result = await db.query(
      `SELECT oi.*, ob.nama as obat_nama
       FROM "OrderItem" oi
       JOIN "Obat" ob ON oi.obat_id = ob.id
       WHERE oi.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const result = await db.query(
      `SELECT oi.*, ob.nama as obat_nama
       FROM "OrderItem" oi
       JOIN "Obat" ob ON oi.obat_id = ob.id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  }

  static async update(id, { quantity, unit_price }) {
    const subtotal = quantity * unit_price;
    
    const result = await db.query(
      `UPDATE "OrderItem"
       SET quantity = $2, unit_price = $3, subtotal = $4
       WHERE id = $1
       RETURNING *`,
      [id, quantity, unit_price, subtotal]
    );
    
    // Update order total
    if (result.rows.length > 0) {
      await db.query(
        `UPDATE "Order"
         SET total_harga = (
           SELECT SUM(subtotal) FROM "OrderItem" WHERE order_id = $1
         )
         WHERE id = $1`,
        [result.rows[0].order_id]
      );
    }
    
    return result.rows[0];
  }

  static async delete(id) {
    // Get the order_id before deleting for total update
    const orderItem = await db.query(
      `SELECT order_id FROM "OrderItem" WHERE id = $1`,
      [id]
    );
    
    if (orderItem.rows.length === 0) return false;
    
    const orderId = orderItem.rows[0].order_id;
    
    // Delete the item
    await db.query(`DELETE FROM "OrderItem" WHERE id = $1`, [id]);
    
    // Update order total
    await db.query(
      `UPDATE "Order"
       SET total_harga = COALESCE((
         SELECT SUM(subtotal) FROM "OrderItem" WHERE order_id = $1
       ), 0)
       WHERE id = $1`,
      [orderId]
    );
    
    return true;
  }
}

module.exports = OrderItem;