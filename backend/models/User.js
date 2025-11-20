const pool = require('./database');
const bcrypt = require('bcryptjs');

class User {
  // Crear usuario
  static async create({ email, password, username }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert compatible con esquemas "password" o "password_hash"
    const query = `
      INSERT INTO users (email, password, username, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, email, username, created_at
    `;

    let result;
    try {
      result = await pool.query(query, [email, hashedPassword, username]);
    } catch (err) {
      // Si falla por falta de columna password, intentar con password_hash
      const alt = `
        INSERT INTO users (email, password_hash, username, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, email, username, created_at
      `;
      result = await pool.query(alt, [email, hashedPassword, username]);
    }
    return result.rows[0];
  }

  // Buscar usuario por email
  static async findByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Buscar usuario por ID
  static async findById(id) {
    const query = `
  SELECT id, email, username, tiktok_username, tiktok_email, created_at, updated_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Actualizar configuraciones del usuario
  static async updateSettings(userId, settings) {
    const query = `
  UPDATE users 
  SET tiktok_username = $1, tiktok_email = $2, game_settings = $3, updated_at = NOW()
  WHERE id = $4
  RETURNING id, email, username, tiktok_username, tiktok_email, game_settings
    `;
    
    let settingsValue = null;
    if (settings && Object.prototype.hasOwnProperty.call(settings, 'gameSettings')) {
      const gs = settings.gameSettings;
      if (gs == null) {
        settingsValue = null;
      } else if (typeof gs === 'string') {
        // Asumimos JSON válido o guardamos cadena
        try { settingsValue = JSON.parse(gs); } catch { settingsValue = gs; }
      } else {
        try { settingsValue = JSON.stringify(gs); } catch { settingsValue = null; }
      }
    }

    const result = await pool.query(query, [
      settings.tiktokUsername || null,
      settings.tiktokEmail || null,
      settingsValue,
      userId
    ]);
    
    return result.rows[0];
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPasswordOrMaybeNull) {
    if (!hashedPasswordOrMaybeNull) return false;
    return await bcrypt.compare(plainPassword, hashedPasswordOrMaybeNull);
  }

  // Obtener estadísticas del usuario
  static async getStats(userId) {
    const query = `
      SELECT 
        COUNT(g.id) as total_games,
        COALESCE(SUM(g.total_donations), 0) as total_donations,
        COALESCE(AVG(g.total_donations), 0) as avg_donations
      FROM games g
      WHERE g.user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = User;
