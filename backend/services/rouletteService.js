const db = require('../models/database');

// Datos en memoria para cuando no hay DB
let inMemoryConfigs = [];
let inMemoryHistory = [];
let inMemoryStats = [];
let nextConfigId = 1;
let nextHistoryId = 1;
let nextStatsId = 1;

// Verificar si la DB está disponible
const isDBAvailable = () => {
  return db.dbAvailable && db.dbAvailable();
};

class RouletteService {
  // Obtener todas las configuraciones de ruleta de un usuario
  async getRouletteConfigurations(userId) {
    if (!isDBAvailable()) {
      console.log('⚠️ Obteniendo configuraciones de ruleta desde memoria');
      return inMemoryConfigs.filter(c => c.user_id === userId && c.is_active)
        .sort((a, b) => {
          if (a.is_default !== b.is_default) return b.is_default ? 1 : -1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    const query = `
      SELECT id, name, description, options, is_default, is_active, created_at, updated_at
      FROM roulette_configurations 
      WHERE user_id = $1 AND is_active = true
      ORDER BY is_default DESC, created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Obtener una configuración específica
  async getRouletteConfiguration(configId) {
    if (!isDBAvailable()) {
      console.log('⚠️ Obteniendo configuración desde memoria');
      return inMemoryConfigs.find(c => c.id === configId && c.is_active);
    }

    const query = `
      SELECT id, user_id, name, description, options, is_default, is_active, created_at, updated_at
      FROM roulette_configurations 
      WHERE id = $1 AND is_active = true
    `;
    const result = await db.query(query, [configId]);
    return result.rows[0];
  }

  // Crear nueva configuración de ruleta
  async createRouletteConfiguration(userId, name, description, options) {
    if (!isDBAvailable()) {
      console.log('💾 Creando configuración de ruleta en memoria');
      const newConfig = {
        id: nextConfigId++,
        user_id: userId,
        name,
        description,
        options,
        is_default: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryConfigs.push(newConfig);
      return newConfig;
    }

    const query = `
      INSERT INTO roulette_configurations (user_id, name, description, options)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, options, is_default, is_active, created_at, updated_at
    `;
    const result = await db.query(query, [userId, name, description, JSON.stringify(options)]);
    return result.rows[0];
  }

  // Actualizar configuración de ruleta
  async updateRouletteConfiguration(configId, userId, name, description, options) {
    const query = `
      UPDATE roulette_configurations 
      SET name = $1, description = $2, options = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, description, options, is_default, is_active, created_at, updated_at
    `;
    const result = await db.query(query, [name, description, JSON.stringify(options), configId, userId]);
    return result.rows[0];
  }

  // Eliminar configuración de ruleta (soft delete)
  async deleteRouletteConfiguration(configId, userId) {
    const query = `
      UPDATE roulette_configurations 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND is_default = false
      RETURNING id
    `;
    const result = await db.query(query, [configId, userId]);
    return result.rows[0];
  }

  // Registrar un giro en el historial
  async recordSpin(rouletteConfigId, sessionId, winnerOption, spinNumber, rotationDegrees, durationSeconds, triggeredByDonation = false, donationId = null, viewerCount = 0) {
    const query = `
      INSERT INTO roulette_history (
        roulette_config_id, session_id, winner_option, spin_number, 
        rotation_degrees, duration_seconds, triggered_by_donation, 
        donation_id, viewer_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `;
    const result = await db.query(query, [
      rouletteConfigId, sessionId, JSON.stringify(winnerOption), 
      spinNumber, rotationDegrees, durationSeconds, triggeredByDonation, 
      donationId, viewerCount
    ]);
    
    // Actualizar estadísticas de la sesión
    await this.updateSessionStats(sessionId, rouletteConfigId, winnerOption);
    
    return result.rows[0];
  }

  // Obtener historial de giros
  async getSpinHistory(sessionId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        h.id, h.winner_option, h.spin_number, h.rotation_degrees, 
        h.duration_seconds, h.triggered_by_donation, h.viewer_count, 
        h.created_at,
        rc.name as roulette_name,
        d.donor_username, d.amount as donation_amount
      FROM roulette_history h
      LEFT JOIN roulette_configurations rc ON h.roulette_config_id = rc.id
      LEFT JOIN donations d ON h.donation_id = d.id
      WHERE h.session_id = $1
      ORDER BY h.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [sessionId, limit, offset]);
    return result.rows;
  }

  // Eliminar historial de una configuración específica
  async deleteRouletteHistory(configId, userId) {
    // Verificar que la configuración pertenezca al usuario
    const configCheck = await db.query(
      'SELECT id FROM roulette_configurations WHERE id = $1 AND user_id = $2',
      [configId, userId]
    );
    
    if (configCheck.rows.length === 0) {
      throw new Error('No tienes permisos para eliminar este historial');
    }

    // Eliminar el historial
    const query = 'DELETE FROM roulette_history WHERE roulette_config_id = $1';
    const result = await db.query(query, [configId]);
    
    // Eliminar también las estadísticas de sesión relacionadas
    await db.query(
      'DELETE FROM roulette_session_stats WHERE roulette_config_id = $1',
      [configId]
    );
    
    return { deleted: result.rowCount };
  }

  // Actualizar estadísticas de sesión
  async updateSessionStats(sessionId, rouletteConfigId, winnerOption) {
    const query = `
      INSERT INTO roulette_session_stats (
        session_id, roulette_config_id, total_spins, 
        most_won_option, most_won_option_count
      )
      VALUES ($1, $2, 1, $3, 1)
      ON CONFLICT (session_id, roulette_config_id)
      DO UPDATE SET
        total_spins = roulette_session_stats.total_spins + 1,
        most_won_option = CASE
          WHEN roulette_session_stats.most_won_option_count < (
            SELECT COUNT(*) FROM roulette_history 
            WHERE session_id = $1 AND roulette_config_id = $2 
            AND winner_option->>'label' = $3
          ) THEN $3
          ELSE roulette_session_stats.most_won_option
        END,
        most_won_option_count = CASE
          WHEN roulette_session_stats.most_won_option_count < (
            SELECT COUNT(*) FROM roulette_history 
            WHERE session_id = $1 AND roulette_config_id = $2 
            AND winner_option->>'label' = $3
          ) THEN (
            SELECT COUNT(*) FROM roulette_history 
            WHERE session_id = $1 AND roulette_config_id = $2 
            AND winner_option->>'label' = $3
          )
          ELSE roulette_session_stats.most_won_option_count
        END,
        updated_at = CURRENT_TIMESTAMP
    `;
    await db.query(query, [sessionId, rouletteConfigId, winnerOption.label]);
  }

  // Obtener estadísticas de una sesión
  async getSessionStats(sessionId) {
    const query = `
      SELECT 
        s.*,
        rc.name as roulette_name,
        COUNT(h.id) as actual_spins
      FROM roulette_session_stats s
      LEFT JOIN roulette_configurations rc ON s.roulette_config_id = rc.id
      LEFT JOIN roulette_history h ON s.session_id = h.session_id AND s.roulette_config_id = h.roulette_config_id
      WHERE s.session_id = $1
      GROUP BY s.id, rc.name
      ORDER BY s.created_at DESC
    `;
    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  // Resetear estadísticas de una ruleta específica
  async resetRouletteStats(sessionId, rouletteConfigId, userId) {
    // Verificar permisos
    const configCheck = await db.query(
      'SELECT id FROM roulette_configurations WHERE id = $1 AND user_id = $2',
      [rouletteConfigId, userId]
    );
    
    if (configCheck.rows.length === 0) {
      throw new Error('No tienes permisos para resetear estas estadísticas');
    }

    // Eliminar historial
    await db.query(
      'DELETE FROM roulette_history WHERE session_id = $1 AND roulette_config_id = $2',
      [sessionId, rouletteConfigId]
    );

    // Resetear estadísticas
    const query = `
      UPDATE roulette_session_stats 
      SET 
        total_spins = 0,
        total_gifts_received = 0,
        total_coins_earned = 0,
        most_won_option = NULL,
        most_won_option_count = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = $1 AND roulette_config_id = $2
    `;
    const result = await db.query(query, [sessionId, rouletteConfigId]);
    
    return { success: true, reset: result.rowCount > 0 };
  }

  // Obtener configuración por defecto
  async getDefaultConfiguration(userId) {
    if (!isDBAvailable()) {
      console.log('⚠️ Obteniendo configuración por defecto desde memoria');
      const userConfigs = inMemoryConfigs.filter(c => (c.user_id === userId || c.is_default) && c.is_active);
      userConfigs.sort((a, b) => {
        if (a.user_id !== b.user_id) return a.user_id === userId ? -1 : 1;
        if (a.is_default !== b.is_default) return b.is_default ? 1 : -1;
        return 0;
      });
      return userConfigs[0];
    }

    const query = `
      SELECT id, name, description, options, is_default, is_active, created_at, updated_at
      FROM roulette_configurations 
      WHERE (user_id = $1 OR is_default = true) AND is_active = true
      ORDER BY user_id DESC, is_default DESC
      LIMIT 1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = new RouletteService();
