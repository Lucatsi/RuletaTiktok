# 🗄️ Guía Completa: Conexión a PostgreSQL

## 📥 Instalación de PostgreSQL

### Windows:
1. **Descargar PostgreSQL:**
   - Ve a: https://www.postgresql.org/download/windows/
   - Descarga la versión 15 o superior
   - Ejecutar el instalador

2. **Durante la instalación:**
   - Puerto: `5432` (por defecto)
   - Usuario: `postgres`
   - **Contraseña:** ¡RECUERDA ESTA CONTRASEÑA!
   - Instalar pgAdmin (recomendado)

### Verificar instalación:
```powershell
# Verificar que PostgreSQL esté ejecutándose
Get-Service postgresql*

# O verificar conexión
pg_isready -h localhost -p 5432
```

## ⚙️ Configuración para Ruleta TikTok

### 1. Crear la base de datos:

#### Opción A: Con pgAdmin (Gráfico)
1. Abrir pgAdmin
2. Conectar con usuario `postgres` y tu contraseña
3. Clic derecho en "Databases" → "Create" → "Database"
4. Nombre: `ruleta_tiktok`
5. Guardar

#### Opción B: Con línea de comandos
```powershell
# Conectar a PostgreSQL
psql -U postgres -h localhost

# Crear base de datos
CREATE DATABASE ruleta_tiktok;

# Verificar que se creó
\l

# Salir
\q
```

### 2. Configurar variables de entorno:

Editar `backend\.env`:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruleta_tiktok
DB_USER=postgres
DB_PASS=TU_CONTRASEÑA_AQUI

# Otras configuraciones
PORT=3001
JWT_SECRET=tu_jwt_secreto_super_seguro_de_32_caracteres_minimo
NODE_ENV=development
```

### 3. Probar conexión:

```powershell
cd backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ruleta_tiktok',
  password: 'TU_CONTRASEÑA',
  port: 5432,
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ Error:', err.message);
  } else {
    console.log('✅ Conexión exitosa:', res.rows[0]);
  }
  pool.end();
});
"
```

## 🏗️ Ejecutar migraciones

Una vez configurado:

```powershell
cd backend
npm run migrate
```

Esto creará las tablas:
- `users` - Usuarios registrados
- `games` - Sesiones de juego
- `donations` - Donaciones recibidas

## 🔧 Solución de problemas

### ❌ "Connection refused"
```powershell
# Verificar que PostgreSQL esté ejecutándose
Get-Service postgresql*

# Si está detenido, iniciarlo:
Start-Service postgresql-x64-15  # Ajusta el nombre
```

### ❌ "Password authentication failed"
1. Verifica la contraseña en `.env`
2. O resetea la contraseña:
   ```powershell
   # Como administrador
   psql -U postgres
   ALTER USER postgres PASSWORD 'nueva_contraseña';
   ```

### ❌ "Database does not exist"
```powershell
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE ruleta_tiktok;"
```

### ❌ "Permission denied"
- Ejecutar PowerShell como administrador
- Verificar que el usuario `postgres` tenga permisos

## 📊 Verificar que todo funcione

### 1. Conexión básica:
```javascript
// En backend/models/database.js ya está configurado
// Solo ejecuta:
npm run dev
```

### 2. Ver tablas creadas:
```sql
# Conectar a la base de datos
psql -U postgres -d ruleta_tiktok

# Ver tablas
\dt

# Ver estructura de tabla usuarios
\d users

# Salir
\q
```

### 3. Datos de prueba (opcional):
```sql
-- Insertar usuario de prueba
INSERT INTO users (email, password, username) 
VALUES ('test@test.com', 'hash_password', 'test_user');

-- Ver usuarios
SELECT * FROM users;
```

## 🚀 Configuración de producción

Para cuando quieras subir a un servidor:

```env
# Producción
DB_HOST=tu-servidor-db.com
DB_PORT=5432
DB_NAME=ruleta_tiktok_prod
DB_USER=tu_usuario_prod
DB_PASS=contraseña_super_segura_prod
NODE_ENV=production
```

## 💡 Tips adicionales

### Backup de base de datos:
```powershell
# Crear backup
pg_dump -U postgres -h localhost ruleta_tiktok > backup.sql

# Restaurar backup
psql -U postgres -h localhost ruleta_tiktok < backup.sql
```

### Herramientas útiles:
- **pgAdmin:** Interface gráfica
- **DBeaver:** Cliente universal
- **TablePlus:** Cliente moderno (Mac/Windows)

### Monitoreo:
```sql
-- Ver conexiones activas
SELECT * FROM pg_stat_activity WHERE datname = 'ruleta_tiktok';

-- Ver tamaño de base de datos
SELECT pg_size_pretty(pg_database_size('ruleta_tiktok'));
```

¡Con esto ya tienes PostgreSQL completamente configurado! 🎉
