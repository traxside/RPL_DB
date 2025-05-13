const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Dokter {
  static async create({ user_id, spesialisasi, jadwal }) {
    const result = await db.query(
      `INSERT INTO "Dokter" (user_id, spesialisasi, jadwal)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, spesialisasi, jadwal ? JSON.stringify(jadwal) : null]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT d.*, u.name, u.phone_number, u.email FROM "Dokter" d
       JOIN "User" u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT d.*, u.name, u.phone_number, u.email FROM "Dokter" d
       JOIN "User" u ON d.user_id = u.id
       WHERE d.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Special handling for jadwal which needs to be converted to JSON
    const processedValues = values.map((val, index) => {
      if (keys[index] === 'jadwal' && val !== null) {
        return typeof val === 'string' ? val : JSON.stringify(val);
      }
      return val;
    });
    
    // Construct SET part of query
    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "Dokter" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...processedValues]);
    return result.rows[0];
  }

  static async getAllDoctors(limit = 100, offset = 0, specialization = null) {
    let query = `
      SELECT d.*, u.name, u.phone_number, u.email 
      FROM "Dokter" d
      JOIN "User" u ON d.user_id = u.id
    `;
    
    const queryParams = [];
    
    if (specialization) {
      query += ` WHERE d.spesialisasi = $3`;
      queryParams.push(specialization);
    }
    
    query += `
      ORDER BY u.name
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset, ...queryParams]);
    return result.rows;
  }

  static async getDoctorsBySpecialization(specialization) {
    const result = await db.query(
      `SELECT d.*, u.name, u.phone_number, u.email 
       FROM "Dokter" d
       JOIN "User" u ON d.user_id = u.id
       WHERE d.spesialisasi = $1
       ORDER BY u.name`,
      [specialization]
    );
    return result.rows;
  }

  static async getAvailableDoctors(date) {
    // This is a simplified implementation
    // For production, you'd need more complex logic to check availability
    const result = await db.query(
      `SELECT d.*, u.name, u.phone_number, u.email 
       FROM "Dokter" d
       JOIN "User" u ON d.user_id = u.id
       WHERE jadwal IS NOT NULL
       ORDER BY u.name`
    );
    
    // Filter available doctors based on their schedule
    // This would need to be implemented based on your jadwal structure
    return result.rows;
  }

  static async delete(id) {
    await db.query(`DELETE FROM "Dokter" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Dokter;