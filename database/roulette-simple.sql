-- Tablas para el sistema de historial de ruletas (sin dependencias externas)

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

-- Tabla para el historial de giros de ruleta (simplificada)
CREATE TABLE IF NOT EXISTS roulette_history (
    id SERIAL PRIMARY KEY,
    roulette_config_id INTEGER REFERENCES roulette_configurations(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL DEFAULT 1, -- Simplificado a un ID numérico
    winner_option JSONB NOT NULL, -- La opción ganadora completa
    spin_number INTEGER NOT NULL, -- Número de giro en la sesión
    rotation_degrees DECIMAL(10,2) NOT NULL, -- Grados de rotación final
    duration_seconds DECIMAL(5,2) NOT NULL, -- Duración del giro
    triggered_by_donation BOOLEAN DEFAULT false,
    donation_id INTEGER REFERENCES donations(id) ON DELETE SET NULL,
    viewer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para estadísticas de ruleta por sesión (simplificada)
CREATE TABLE IF NOT EXISTS roulette_session_stats (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL DEFAULT 1, -- Simplificado
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

-- Índices para optimizar rendimiento
CREATE INDEX IF NOT EXISTS idx_roulette_configs_user_id ON roulette_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_roulette_configs_default ON roulette_configurations(is_default, user_id) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_roulette_history_config_session ON roulette_history(roulette_config_id, session_id);
CREATE INDEX IF NOT EXISTS idx_roulette_history_created ON roulette_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roulette_stats_session ON roulette_session_stats(session_id, roulette_config_id);

-- Función para actualizar el timestamp updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_roulette_configurations_updated_at ON roulette_configurations;
CREATE TRIGGER update_roulette_configurations_updated_at
    BEFORE UPDATE ON roulette_configurations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_roulette_session_stats_updated_at ON roulette_session_stats;
CREATE TRIGGER update_roulette_session_stats_updated_at
    BEFORE UPDATE ON roulette_session_stats
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- No insertar configuración por defecto automáticamente
-- La aplicación se encargará de crearla cuando sea necesario
