const pool = require('./database');
const bcrypt = require('bcryptjs');

// Almacenamiento en memoria cuando no hay DB
let inMemoryUsers = [];
let nextId = 1;

// Verificar si la DB está disponible
const isDBAvailable = () => {
  return pool.dbAvailable ? pool.dbAvailable() : false;
};

class User {
  // Crear usuario
  static async create({ email, password, username }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Si no hay DB, usar memoria
    if (!isDBAvailable()) {
      console.log('💾 Creando usuario en memoria (sin DB)');
      const user = {
        id: nextId++,
        email,
        password: hashedPassword,
        username,
        created_at: new Date()
      };
      inMemoryUsers.push(user);
      return user;
    }
    
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
    // Si no hay DB, buscar en memoria
    if (!isDBAvailable()) {
      return inMemoryUsers.find(u => u.email === email);
    }
    
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Buscar usuario por ID
  static async findById(id) {
    // Si no hay DB, buscar en memoria
    if (!isDBAvailable()) {
      return inMemoryUsers.find(u => u.id === parseInt(id));
    }
    
    const query = `
      SELECT id, email, username, tiktok_username, tiktok_email, created_at, updated_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Actualizar configuraciones del usuario
  static async updateSettings(userId, settings) {
    // Si no hay DB, actualizar en memoria
    if (!isDBAvailable()) {
      const user = inMemoryUsers.find(u => u.id === parseInt(userId));
      if (user) {
        user.tiktok_username = settings.tiktokUsername || null;
        user.tiktok_email = settings.tiktokEmail || null;
        user.game_settings = settings.gameSettings || null;
        user.updated_at = new Date();
      }
      return user;
    }
    
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
    // Si no hay DB, retornar stats vacías
    if (!isDBAvailable()) {
      return {
        total_games: 0,
        total_donations: 0,
        avg_donations: 0
      };
    }
    
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
