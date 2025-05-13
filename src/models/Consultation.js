const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Consultation {
  static async create({ pasien_id, dokter_id, consultation_date, status, hasil_konsultasi = null }) {
    const result = await db.query(
      `INSERT INTO "Consultation" (
        pasien_id, dokter_id, consultation_date, status, hasil_konsultasi
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [pasien_id, dokter_id, consultation_date, status, hasil_konsultasi]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT c.*, 
        p.id as pasien_id, u_p.name as pasien_name,
        d.id as dokter_id, u_d.name as dokter_name, d.spesialisasi
       FROM "Consultation" c
       JOIN "Pasien" p ON c.pasien_id = p.id
       JOIN "User" u_p ON p.user_id = u_p.id
       JOIN "Dokter" d ON c.dokter_id = d.id
       JOIN "User" u_d ON d.user_id = u_d.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByPatientId(patientId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT c.*, 
        d.id as dokter_id, u_d.name as dokter_name, d.spesialisasi
       FROM "Consultation" c
       JOIN "Dokter" d ON c.dokter_id = d.id
       JOIN "User" u_d ON d.user_id = u_d.id
       WHERE c.pasien_id = $1
       ORDER BY c.consultation_date DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );
    return result.rows;
  }

  static async findByDoctorId(doctorId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT c.*, 
        p.id as pasien_id, u_p.name as pasien_name
       FROM "Consultation" c
       JOIN "Pasien" p ON c.pasien_id = p.id
       JOIN "User" u_p ON p.user_id = u_p.id
       WHERE c.dokter_id = $1
       ORDER BY c.consultation_date DESC
       LIMIT $2 OFFSET $3`,
      [doctorId, limit, offset]
    );
    return result.rows;
  }

  static async getUpcomingConsultations(doctorId, limit = 10) {
    const now = new Date();
    const result = await db.query(
      `SELECT c.*, 
        p.id as pasien_id, u_p.name as pasien_name
       FROM "Consultation" c
       JOIN "Pasien" p ON c.pasien_id = p.id
       JOIN "User" u_p ON p.user_id = u_p.id
       WHERE c.dokter_id = $1
       AND c.consultation_date > $2
       AND c.status = 'scheduled'
       ORDER BY c.consultation_date ASC
       LIMIT $3`,
      [doctorId, now, limit]
    );
    return result.rows;
  }

  static async getUpcomingPatientConsultations(patientId, limit = 10) {
    const now = new Date();
    const result = await db.query(
      `SELECT c.*, 
        d.id as dokter_id, u_d.name as dokter_name, d.spesialisasi
       FROM "Consultation" c
       JOIN "Dokter" d ON c.dokter_id = d.id
       JOIN "User" u_d ON d.user_id = u_d.id
       WHERE c.pasien_id = $1
       AND c.consultation_date > $2
       AND c.status = 'scheduled'
       ORDER BY c.consultation_date ASC
       LIMIT $3`,
      [patientId, now, limit]
    );
    return result.rows;
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Construct SET part of query
    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "Consultation" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async updateStatus(id, status, hasil_konsultasi = null) {
    const result = await db.query(
      `UPDATE "Consultation" 
       SET status = $2, hasil_konsultasi = $3
       WHERE id = $1
       RETURNING *`,
      [id, status, hasil_konsultasi]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query(`DELETE FROM "Consultation" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Consultation;