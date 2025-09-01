-- Crear usuario y base de datos
CREATE USER tiktok WITH PASSWORD 'tiktok123';
CREATE DATABASE ruletiktok OWNER tiktok;

-- Conectar a la base ruletiktok
\c ruletiktok

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE ruletiktok TO tiktok;
GRANT ALL ON SCHEMA public TO tiktok;

-- Tabla de usuarios
CREATE TABLE users (
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
CREATE TABLE user_settings (
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
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_donation DECIMAL(10,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    game_type VARCHAR(50) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dar permisos específicos
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tiktok;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tiktok;

-- Insertar juegos por defecto
INSERT INTO games (name, description, min_donation, game_type, settings) VALUES
('Ruleta de la Suerte', 'Ruleta con premios aleatorios basada en donaciones', 1.00, 'ruleta', '{"sectors": 8, "prizes": ["¡GANASTE!", "Sigue intentando", "¡PREMIO!", "Casi...", "¡JACKPOT!", "Próxima vez", "¡EXCELENTE!", "Inténtalo de nuevo"]}'),
('Juego de Disparos', 'Objetivo con puntuación basada en donaciones', 2.00, 'disparos', '{"targets": 5, "timeLimit": 30, "difficulty": "normal"}'),
('Barra de Vida', 'Barra que se llena con las donaciones del stream', 0.50, 'barra_vida', '{"maxHealth": 100, "healthPerDollar": 10}'),
('Ranking de Donadores', 'Tabla de clasificación de los mejores donadores', 0.10, 'ranking', '{"topCount": 10, "resetDaily": false}');

SELECT 'Configuración completada exitosamente!' as resultado;
