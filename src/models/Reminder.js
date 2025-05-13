const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Reminder {
  static async create({ pasien_id, obat_id, reminder_time, dosage, frequency, status = 'active' }) {
    const result = await db.query(
      `INSERT INTO "Reminder" (pasien_id, obat_id, reminder_time, dosage, frequency, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [pasien_id, obat_id, reminder_time, dosage, frequency, status]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT r.*, o.nama as obat_nama, o.dosis as obat_dosis
       FROM "Reminder" r
       JOIN "Obat" o ON r.obat_id = o.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByPatientId(patientId) {
    const result = await db.query(
      `SELECT r.*, o.nama as obat_nama, o.dosis as obat_dosis
       FROM "Reminder" r
       JOIN "Obat" o ON r.obat_id = o.id
       WHERE r.pasien_id = $1
       ORDER BY r.reminder_time ASC`,
      [patientId]
    );
    return result.rows;
  }

  static async findActiveByPatientId(patientId) {
    const result = await db.query(
      `SELECT r.*, o.nama as obat_nama, o.dosis as obat_dosis
       FROM "Reminder" r
       JOIN "Obat" o ON r.obat_id = o.id
       WHERE r.pasien_id = $1 AND r.status = 'active'
       ORDER BY r.reminder_time ASC`,
      [patientId]
    );
    return result.rows;
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Construct SET part of query
    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "Reminder" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE "Reminder"
       SET status = $2
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query(`DELETE FROM "Reminder" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Reminder;