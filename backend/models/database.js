const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Variables de entorno:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASS:', process.env.DB_PASS ? '***' : 'NO DEFINIDA');
console.log('DB_PORT:', process.env.DB_PORT);

// Pool de la aplicación (usa las credenciales configuradas)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Variable para verificar si la DB está disponible
let dbAvailable = false;

// Migración idempotente para garantizar el esquema esperado por models/User.js
const migrate = async () => {
  try {
    console.log('🔧 Verificando/Actualizando esquema de tabla users...');
    const client = await pool.connect();

    // Crear tabla si no existe con el esquema esperado por User.js
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        tiktok_username VARCHAR(100),
        game_settings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Si existe password_hash pero no password, renombrar
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='password_hash'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='password'
        ) THEN
          EXECUTE 'ALTER TABLE users RENAME COLUMN password_hash TO password';
        END IF;
      END$$;
    `);

    // Si existen ambas columnas, consolidar en password y eliminar password_hash
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password'
        ) THEN
          -- Copiar valores faltantes
          EXECUTE 'UPDATE users SET password = COALESCE(password, password_hash)';
          -- Eliminar columna antigua
          EXECUTE 'ALTER TABLE users DROP COLUMN password_hash';
        END IF;
      END$$;
    `);

    // Asegurar columnas esperadas (idempotente)
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE NOT NULL");
  await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)");
  await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_username VARCHAR(100)");
  await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_email VARCHAR(255)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS game_settings JSONB");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

  // Asegurar restricciones NOT NULL tras la consolidación
  await client.query("ALTER TABLE users ALTER COLUMN email SET NOT NULL");
  await client.query("ALTER TABLE users ALTER COLUMN username SET NOT NULL");
  await client.query("ALTER TABLE users ALTER COLUMN password SET NOT NULL");

    // === Tablas de juegos y donaciones ===
    console.log('🔧 Verificando/Actualizando tablas de juegos y donaciones...');

    // Tabla games
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        game_type VARCHAR(50) NOT NULL,
        settings JSONB,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        total_donations INTEGER DEFAULT 0,
        stats JSONB
      )
    `);

    // Índices recomendados para games
    await client.query("CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_games_type_status ON games(game_type, status)");

    // Tabla donations
    await client.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        donor_name VARCHAR(255),
        gift_type VARCHAR(100),
        gift_count INTEGER DEFAULT 1,
        coins_value INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices recomendados para donations
    await client.query("CREATE INDEX IF NOT EXISTS idx_donations_game ON donations(game_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_name)");

    // === Tablas de Ruleta ===
    console.log('🔧 Verificando/Actualizando tablas de ruleta...');

    // Configuraciones de ruleta
    await client.query(`
      CREATE TABLE IF NOT EXISTS roulette_configurations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        options JSONB NOT NULL DEFAULT '[]',
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query("CREATE INDEX IF NOT EXISTS idx_roulette_cfg_user ON roulette_configurations(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_roulette_cfg_active ON roulette_configurations(is_active)");

    // Historial de giros de ruleta
    await client.query(`
      CREATE TABLE IF NOT EXISTS roulette_history (
        id SERIAL PRIMARY KEY,
        roulette_config_id INTEGER REFERENCES roulette_configurations(id) ON DELETE CASCADE,
        session_id VARCHAR(100) NOT NULL,
        winner_option JSONB NOT NULL,
        spin_number INTEGER NOT NULL,
        rotation_degrees INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        triggered_by_donation BOOLEAN DEFAULT false,
        donation_id INTEGER,
        viewer_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query("CREATE INDEX IF NOT EXISTS idx_roulette_hist_cfg ON roulette_history(roulette_config_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_roulette_hist_session ON roulette_history(session_id)");

    // Estadísticas de sesión de ruleta
    await client.query(`
      CREATE TABLE IF NOT EXISTS roulette_session_stats (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        roulette_config_id INTEGER REFERENCES roulette_configurations(id) ON DELETE CASCADE,
        total_spins INTEGER DEFAULT 0,
        total_gifts_received INTEGER DEFAULT 0,
        total_coins_earned INTEGER DEFAULT 0,
        most_won_option VARCHAR(255),
        most_won_option_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, roulette_config_id)
      )
    `);

    await client.query("CREATE INDEX IF NOT EXISTS idx_roulette_stats_cfg ON roulette_session_stats(roulette_config_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_roulette_stats_session ON roulette_session_stats(session_id)");

    client.release();
    dbAvailable = true;
  } catch (err) {
    console.log('⚠️ Migración no crítica fallida (continuando con la app):', err.message);
    dbAvailable = false;
  }
};

// Probar conexión y correr migraciones
const bootstrap = async () => {
  try {
    await migrate();
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    dbAvailable = true;
    client.release();
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    console.log('⚠️ La aplicación funcionará en modo sin base de datos (datos en memoria)');
    dbAvailable = false;
  }
};

bootstrap();

module.exports = pool;
module.exports.dbAvailable = () => dbAvailable;
