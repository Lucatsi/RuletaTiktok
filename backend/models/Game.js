const pool = require('./database');

class Game {
  // Crear nueva sesión de juego
  static async createSession(userId, gameType, settings = {}) {
    const query = `
      INSERT INTO games (user_id, game_type, settings, status, created_at)
      VALUES ($1, $2, $3, 'active', NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,
      gameType,
      JSON.stringify(settings)
    ]);
    
    return result.rows[0];
  }

  // Obtener sesión activa del usuario
  static async getActiveSession(userId, gameType) {
    const query = `
      SELECT * FROM games 
      WHERE user_id = $1 AND game_type = $2 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [userId, gameType]);
    return result.rows[0];
  }

  // Finalizar sesión de juego
  static async endSession(gameId, stats = {}) {
    const query = `
      UPDATE games 
      SET status = 'completed', 
          end_time = NOW(),
          total_donations = $2,
          stats = $3
      WHERE id = $1
      RETURNING *
    `;
    
    const total = typeof stats.totalDonations === 'number' ? stats.totalDonations : 0;
    let statsJson = null;
    try { statsJson = JSON.stringify(stats || {}); } catch { statsJson = JSON.stringify({}); }

    const result = await pool.query(query, [
      gameId,
      total,
      statsJson
    ]);
    
    return result.rows[0];
  }

  // Obtener historial de juegos del usuario
  static async getHistory(userId, limit = 10) {
    const query = `
      SELECT 
        id, game_type, created_at, end_time, 
        total_donations, stats, status
      FROM games 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Registrar donación en el juego
  static async recordDonation(gameId, donation) {
    const query = `
      INSERT INTO donations (game_id, donor_name, gift_type, gift_count, coins_value, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      gameId,
      donation.donorName,
      donation.giftType,
      donation.giftCount,
      donation.coinsValue
    ]);
    
    return result.rows[0];
  }

  // Obtener top donadores de un juego
  static async getTopDonors(gameId, limit = 10) {
    const query = `
      SELECT 
        donor_name,
        SUM(coins_value) as total_coins,
        COUNT(*) as donation_count
      FROM donations 
      WHERE game_id = $1 
      GROUP BY donor_name
      ORDER BY total_coins DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [gameId, limit]);
    return result.rows;
  }
}

module.exports = Game;
