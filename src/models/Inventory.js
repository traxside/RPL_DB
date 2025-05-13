const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Inventory {
  static async create({ obat_id, jumlah, tanggal_kadaluarsa, harga, supplier }) {
    const result = await db.query(
      `INSERT INTO "Inventory" (obat_id, jumlah, tanggal_kadaluarsa, harga, supplier)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [obat_id, jumlah, tanggal_kadaluarsa, harga, supplier]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT i.*, o.nama as obat_nama, o.kategori, o.dosis
       FROM "Inventory" i
       JOIN "Obat" o ON i.obat_id = o.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByMedicationId(obatId) {
    const result = await db.query(
      `SELECT i.*, o.nama as obat_nama
       FROM "Inventory" i
       JOIN "Obat" o ON i.obat_id = o.id
       WHERE i.obat_id = $1
       ORDER BY i.tanggal_kadaluarsa ASC`,
      [obatId]
    );
    return result.rows;
  }

  static async getAllInventory(limit = 100, offset = 0) {
    const result = await db.query(
      `SELECT i.*, o.nama as obat_nama, o.kategori, o.dosis
       FROM "Inventory" i
       JOIN "Obat" o ON i.obat_id = o.id
       ORDER BY o.nama, i.tanggal_kadaluarsa ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async getLowStock(threshold = 10) {
    const result = await db.query(
      `SELECT i.*, o.nama as obat_nama, o.kategori
       FROM "Inventory" i
       JOIN "Obat" o ON i.obat_id = o.id
       WHERE i.jumlah <= $1
       ORDER BY i.jumlah ASC`,
      [threshold]
    );
    return result.rows;
  }

  static async getExpiringSoon(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    const result = await db.query(
      `SELECT i.*, o.nama as obat_nama, o.kategori
       FROM "Inventory" i
       JOIN "Obat" o ON i.obat_id = o.id
       WHERE i.tanggal_kadaluarsa <= $1 AND i.jumlah > 0
       ORDER BY i.tanggal_kadaluarsa ASC`,
      [date]
    );
    return result.rows;
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Construct SET part of query
    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "Inventory" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async updateStock(id, quantityChange) {
    const result = await db.query(
      `UPDATE "Inventory"
       SET jumlah = jumlah + $2
       WHERE id = $1
       RETURNING *`,
      [id, quantityChange]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query(`DELETE FROM "Inventory" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Inventory;