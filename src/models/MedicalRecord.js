const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class MedicalRecord {
  static async create({ 
    pasien_id, dokter_id, heartrate, tension, blood_sugar, 
    diagnosis, symptoms, notes, treatment_plan, record_date 
  }) {
    const result = await db.query(
      `INSERT INTO "MedicalRecord" (
        pasien_id, dokter_id, heartrate, tension, blood_sugar,
        diagnosis, symptoms, notes, treatment_plan, record_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        pasien_id, dokter_id, heartrate, tension, blood_sugar,
        diagnosis, symptoms, notes, treatment_plan, record_date
      ]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT mr.*, 
        p.id as pasien_id, u_p.name as pasien_name,
        d.id as dokter_id, u_d.name as dokter_name, d.spesialisasi
       FROM "MedicalRecord" mr
       JOIN "Pasien" p ON mr.pasien_id = p.id
       JOIN "User" u_p ON p.user_id = u_p.id
       JOIN "Dokter" d ON mr.dokter_id = d.id
       JOIN "User" u_d ON d.user_id = u_d.id
       WHERE mr.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByPatientId(patientId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT mr.*, 
        d.id as dokter_id, u_d.name as dokter_name, d.spesialisasi
       FROM "MedicalRecord" mr
       JOIN "Dokter" d ON mr.dokter_id = d.id
       JOIN "User" u_d ON d.user_id = u_d.id
       WHERE mr.pasien_id = $1
       ORDER BY mr.record_date DESC, mr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );
    return result.rows;
  }

  static async findByDoctorId(doctorId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT mr.*, 
        p.id as pasien_id, u_p.name as pasien_name
       FROM "MedicalRecord" mr
       JOIN "Pasien" p ON mr.pasien_id = p.id
       JOIN "User" u_p ON p.user_id = u_p.id
       WHERE mr.dokter_id = $1
       ORDER BY mr.record_date DESC, mr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [doctorId, limit, offset]
    );
    return result.rows;
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Construct SET part of query
    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "MedicalRecord" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query(`DELETE FROM "MedicalRecord" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = MedicalRecord;