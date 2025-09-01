-- Crear base de datos y tablas para la plataforma de juegos TikTok

-- Tabla de usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  tiktok_username VARCHAR(100),
  game_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de sesiones de juegos
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL, -- 'ruleta', 'disparos', 'vida', 'ranking'
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
  total_donations INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP
);

-- Tabla de donaciones
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  donor_name VARCHAR(100) NOT NULL,
  gift_type VARCHAR(100) NOT NULL,
  gift_count INTEGER DEFAULT 1,
  coins_value INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tiktok_username ON users(tiktok_username);
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_type_status ON games(game_type, status);
CREATE INDEX idx_donations_game_id ON donations(game_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
