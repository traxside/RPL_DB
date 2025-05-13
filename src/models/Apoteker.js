const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Apoteker {
  static async create({ user_id }) {
    const result = await db.query(
      `INSERT INTO "Apoteker" (user_id)
       VALUES ($1)
       RETURNING *`,
      [user_id]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT a.*, u.name, u.phone_number, u.email FROM "Apoteker" a
       JOIN "User" u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT a.*, u.name, u.phone_number, u.email FROM "Apoteker" a
       JOIN "User" u ON a.user_id = u.id
       WHERE a.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async getAllApotekers(limit = 100, offset = 0) {
    const result = await db.query(
      `SELECT a.*, u.name, u.phone_number, u.email FROM "Apoteker" a
       JOIN "User" u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async delete(id) {
    await db.query(`DELETE FROM "Apoteker" WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Apoteker;