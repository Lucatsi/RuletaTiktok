-- Esquema de base de datos para RuletaTikTok
-- Base de datos para plataforma de streaming con juegos interactivos

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    avatar_url VARCHAR(500),
    tiktok_username VARCHAR(100),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuraciones de usuario
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    chroma_key_color VARCHAR(7) DEFAULT '#00FF00',
    game_volume FLOAT DEFAULT 0.5,
    notification_sound BOOLEAN DEFAULT true,
    auto_start_games BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(5) DEFAULT 'es',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de juegos
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_donation DECIMAL(10,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    game_type VARCHAR(50) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones de streaming
CREATE TABLE IF NOT EXISTS streaming_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tiktok_username VARCHAR(100) NOT NULL,
    session_name VARCHAR(200),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    total_donations DECIMAL(12,2) DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    session_data JSONB DEFAULT '{}'
);

-- Tabla de donaciones
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES streaming_sessions(id) ON DELETE CASCADE,
    donor_username VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    currency VARCHAR(10) DEFAULT 'USD',
    donation_type VARCHAR(50) DEFAULT 'gift',
    game_triggered VARCHAR(100),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    donation_data JSONB DEFAULT '{}'
);

-- Tabla de resultados de juegos
CREATE TABLE IF NOT EXISTS game_results (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER REFERENCES donations(id) ON DELETE CASCADE,
    game_name VARCHAR(100) NOT NULL,
    result_data JSONB NOT NULL,
    winner_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de rankings
CREATE TABLE IF NOT EXISTS donor_rankings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES streaming_sessions(id) ON DELETE CASCADE,
    donor_username VARCHAR(100) NOT NULL,
    total_donated DECIMAL(12,2) DEFAULT 0,
    donation_count INTEGER DEFAULT 0,
    last_donation TIMESTAMP,
    rank_position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, donor_username)
);

-- Insertar juegos por defecto
INSERT INTO games (name, description, min_donation, game_type, settings) VALUES
('Ruleta de la Suerte', 'Ruleta con premios aleatorios basada en donaciones', 1.00, 'ruleta', '{"sectors": 8, "prizes": ["¡GANASTE!", "Sigue intentando", "¡PREMIO!", "Casi...", "¡JACKPOT!", "Próxima vez", "¡EXCELENTE!", "Inténtalo de nuevo"]}'),
('Juego de Disparos', 'Objetivo con puntuación basada en donaciones', 2.00, 'disparos', '{"targets": 5, "timeLimit": 30, "difficulty": "normal"}'),
('Barra de Vida', 'Barra que se llena con las donaciones del stream', 0.50, 'barra_vida', '{"maxHealth": 100, "healthPerDollar": 10}'),
('Ranking de Donadores', 'Tabla de clasificación de los mejores donadores', 0.10, 'ranking', '{"topCount": 10, "resetDaily": false}');

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_user_id ON streaming_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_active ON streaming_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_donations_session_id ON donations(session_id);
CREATE INDEX IF NOT EXISTS idx_donations_processed_at ON donations(processed_at);
CREATE INDEX IF NOT EXISTS idx_game_results_donation_id ON game_results(donation_id);
CREATE INDEX IF NOT EXISTS idx_donor_rankings_session_id ON donor_rankings(session_id);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donor_rankings_updated_at BEFORE UPDATE ON donor_rankings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
