const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Obat {
  static async create({ nama, kategori, manufacturer, dosis, deskripsi, efek_samping }) {
    const result = await db.query(
      `INSERT INTO "Obat" (nama, kategori, manufacturer, dosis, deskripsi, efek_samping)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nama, kategori, manufacturer, dosis, deskripsi, efek_samping]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT * FROM "Obat" WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByName(name) {
    const result = await db.query(
      `SELECT * FROM "Obat" WHERE nama ILIKE $1`,
      [`%${name}%`]
    );
    return result.rows;
  }

  static async getAllMedications(limit = 100, offset = 0, category = null) {
    let query = `SELECT * FROM "Obat"`;
    const params = [];
    
    if (category) {
      query += ` WHERE kategori = $3`;
      params.push(category);
    }
    
    query += ` ORDER BY nama LIMIT $1 OFFSET $2`;
    params.unshift(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async getCategories() {
    const result = await db.query(
      `SELECT DISTINCT kategori FROM "Obat" WHERE kategori IS NOT NULL`
    );
    return result.rows.map(row => row.kategori);
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Construct SET part of query
    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "Obat" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query(`DELETE FROM "Obat" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Obat;