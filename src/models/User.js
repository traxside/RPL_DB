const db = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create({ name, phone_number, email, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO "User" (name, phone_number, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone_number, email, role, created_at`,
      [name, phone_number, email, hashedPassword, role]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(
      `SELECT * FROM "User" WHERE email = $1`,
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT id, name, phone_number, email, role, created_at FROM "User" WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Don't allow password updates through this method for security
    const allowedFields = keys.filter(key => key !== 'password');
    
    if (allowedFields.length === 0) return null;
    
    // Construct SET part of query
    const setClauses = allowedFields.map((key, i) => `${key} = $${i + 2}`);
    const query = `
      UPDATE "User" 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, name, phone_number, email, role, created_at, updated_at
    `;
    
    // Only include values for allowed fields
    const filteredValues = [id];
    allowedFields.forEach(field => {
      filteredValues.push(data[field]);
    });
    
    const result = await db.query(query, filteredValues);
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      `UPDATE "User" SET password = $2 WHERE id = $1`,
      [id, hashedPassword]
    );
    return true;
  }

  static async delete(id) {
    await db.query(`DELETE FROM "User" WHERE id = $1`, [id]);
    return true;
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

module.exports = User;