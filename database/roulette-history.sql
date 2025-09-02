-- Tablas para el sistema de historial de ruletas

-- Tabla para guardar configuraciones de ruletas
CREATE TABLE IF NOT EXISTS roulette_configurations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    options JSONB NOT NULL, -- Array de opciones con label, color, textColor, probability, etc.
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para el historial de giros de ruleta
CREATE TABLE IF NOT EXISTS roulette_history (
    id SERIAL PRIMARY KEY,
    roulette_config_id INTEGER REFERENCES roulette_configurations(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES streaming_sessions(id) ON DELETE CASCADE,
    winner_option JSONB NOT NULL, -- La opción ganadora completa
    spin_number INTEGER NOT NULL, -- Número de giro en la sesión
    rotation_degrees DECIMAL(10,2) NOT NULL, -- Grados de rotación final
    duration_seconds DECIMAL(5,2) NOT NULL, -- Duración del giro
    triggered_by_donation BOOLEAN DEFAULT false,
    donation_id INTEGER REFERENCES donations(id) ON DELETE SET NULL,
    viewer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para estadísticas de ruleta por sesión
CREATE TABLE IF NOT EXISTS roulette_session_stats (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES streaming_sessions(id) ON DELETE CASCADE,
    roulette_config_id INTEGER REFERENCES roulette_configurations(id) ON DELETE SET NULL,
    total_spins INTEGER DEFAULT 0,
    total_gifts_received INTEGER DEFAULT 0,
    total_coins_earned DECIMAL(12,2) DEFAULT 0,
    average_viewers INTEGER DEFAULT 0,
    most_won_option VARCHAR(200),
    most_won_option_count INTEGER DEFAULT 0,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, roulette_config_id)
);

-- Insertar configuración por defecto de la ruleta
INSERT INTO roulette_configurations (user_id, name, description, options, is_default) VALUES
(1, 'Ruleta Épica Clásica', 'Configuración por defecto con premios épicos', 
'[
  {"label": "🔥 FUEGO", "color": "#ff6b6b", "textColor": "#ffffff", "probability": 0.15, "rarity": "common", "emoji": "🔥"},
  {"label": "💎 DIAMANTE", "color": "#ff9ff3", "textColor": "#ffffff", "probability": 0.05, "rarity": "legendary", "emoji": "💎"},
  {"label": "⭐ ESTRELLA", "color": "#48dbfb", "textColor": "#ffffff", "probability": 0.12, "rarity": "rare", "emoji": "⭐"},
  {"label": "🎁 REGALO", "color": "#ff6348", "textColor": "#ffffff", "probability": 0.15, "rarity": "uncommon", "emoji": "🎁"},
  {"label": "🎵 MÚSICA", "color": "#5f27cd", "textColor": "#ffffff", "probability": 0.15, "rarity": "common", "emoji": "🎵"},
  {"label": "🌟 BONUS", "color": "#00d2d3", "textColor": "#ffffff", "probability": 0.15, "rarity": "uncommon", "emoji": "🌟"},
  {"label": "🎭 TEATRO", "color": "#54a0ff", "textColor": "#ffffff", "probability": 0.15, "rarity": "common", "emoji": "🎭"},
  {"label": "🏆 TROFEO", "color": "#feca57", "textColor": "#ffffff", "probability": 0.08, "rarity": "epic", "emoji": "🏆"}
]'::jsonb, true);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_roulette_configurations_user_id ON roulette_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_roulette_configurations_active ON roulette_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_roulette_history_config_id ON roulette_history(roulette_config_id);
CREATE INDEX IF NOT EXISTS idx_roulette_history_session_id ON roulette_history(session_id);
CREATE INDEX IF NOT EXISTS idx_roulette_history_created_at ON roulette_history(created_at);
CREATE INDEX IF NOT EXISTS idx_roulette_session_stats_session_id ON roulette_session_stats(session_id);

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_roulette_configurations_updated_at BEFORE UPDATE ON roulette_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roulette_session_stats_updated_at BEFORE UPDATE ON roulette_session_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
