const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Pasien {
  static async create({ 
    user_id, gender, status, alamat, emergency_contact, 
    blood_type, riwayat_penyakit, obat_dikonsumsi 
  }) {
    const result = await db.query(
      `INSERT INTO "Pasien" (
        user_id, gender, status, alamat, emergency_contact, 
        blood_type, riwayat_penyakit, obat_dikonsumsi
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        user_id, gender, status, alamat, emergency_contact, 
        blood_type, riwayat_penyakit, obat_dikonsumsi
      ]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT p.*, u.name, u.phone_number, u.email FROM "Pasien" p
       JOIN "User" u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT p.*, u.name, u.phone_number, u.email FROM "Pasien" p
       JOIN "User" u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Construct SET part of query
    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "Pasien" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async getAllPatients(limit = 100, offset = 0) {
    const result = await db.query(
      `SELECT p.*, u.name, u.phone_number, u.email FROM "Pasien" p
       JOIN "User" u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async delete(id) {
    // This will also delete the user due to CASCADE constraint
    await db.query(`DELETE FROM "Pasien" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Pasien;