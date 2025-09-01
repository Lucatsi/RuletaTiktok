const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

async function migrate() {
  try {
    console.log('🚀 Iniciando migración de base de datos...');

    // Leer el archivo SQL de esquema
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );

    // Ejecutar el esquema
    await pool.query(schemaSQL);

    console.log('✅ Migración completada exitosamente');
    console.log('📊 Tablas creadas:');
    console.log('   - users (usuarios)');
    console.log('   - games (sesiones de juego)');
    console.log('   - donations (donaciones)');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrate();
