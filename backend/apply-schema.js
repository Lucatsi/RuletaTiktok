const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'tiktok',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ruletiktok',
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5432,
});

async function applySqlFile() {
  try {
    console.log('🔧 Conectando a PostgreSQL...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'roulette-simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Archivo SQL leído, aplicando schema...');
    
    // Ejecutar las queries
    await pool.query(sqlContent);
    
    console.log('✅ Schema aplicado exitosamente!');
    console.log('📊 Tablas de ruleta creadas:');
    console.log('   - roulette_configurations');
    console.log('   - roulette_history');
    console.log('   - roulette_session_stats');
    
  } catch (error) {
    console.error('❌ Error al aplicar schema:', error.message);
  } finally {
    await pool.end();
  }
}

applySqlFile();
