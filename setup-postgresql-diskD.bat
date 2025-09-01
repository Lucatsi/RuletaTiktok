@echo off
REM Configuración automática para PostgreSQL en disco D:

echo ====================================
echo   CONFIGURACION POSTGRESQL (Disco D:)
echo ====================================
echo.

REM Detectar versión de PostgreSQL instalada
echo 🔍 Detectando PostgreSQL en disco D:...
for /d %%i in ("D:\Program Files\PostgreSQL\*") do (
    if exist "%%i\bin\psql.exe" (
        set POSTGRES_PATH=%%i
        set POSTGRES_BIN=%%i\bin
        echo ✅ PostgreSQL encontrado en: %%i
        goto :found
    )
)

echo ❌ No se encontró PostgreSQL en D:\Program Files\PostgreSQL\
echo    Verifica la ruta de instalación
pause
exit /b 1

:found
echo.
echo 🔧 Configurando variables de entorno temporales...
set PATH=%POSTGRES_BIN%;%PATH%

REM Verificar que funcione
echo 🧪 Probando conexión PostgreSQL...
"%POSTGRES_BIN%\pg_isready.exe" -h localhost -p 5432
if %ERRORLEVEL% neq 0 (
    echo ⚠️  PostgreSQL no está ejecutándose. Iniciando servicio...
    net start postgresql*
    if %ERRORLEVEL% neq 0 (
        echo ❌ No se pudo iniciar PostgreSQL automáticamente
        echo    Inicia PostgreSQL manualmente desde:
        echo    - Servicios de Windows (services.msc)
        echo    - O desde pgAdmin
        pause
        exit /b 1
    )
)

echo ✅ PostgreSQL está ejecutándose
echo.

REM Solicitar contraseña
set /p POSTGRES_PASSWORD="💡 Ingresa la contraseña del usuario 'postgres': "

REM Probar conexión con contraseña
echo 🔐 Probando autenticación...
set PGPASSWORD=%POSTGRES_PASSWORD%
"%POSTGRES_BIN%\psql.exe" -U postgres -h localhost -d postgres -c "SELECT 'Conexión exitosa' as status;" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Error de autenticación. Verifica la contraseña.
    pause
    exit /b 1
)

echo ✅ Autenticación exitosa
echo.

REM Crear base de datos
echo 🗄️ Creando base de datos 'ruleta_tiktok'...
"%POSTGRES_BIN%\createdb.exe" -U postgres -h localhost ruleta_tiktok 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✅ Base de datos 'ruleta_tiktok' creada
) else (
    echo ℹ️ Base de datos 'ruleta_tiktok' ya existe
)

REM Configurar archivo .env
echo 📝 Configurando archivo .env...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo ✅ Archivo .env creado desde ejemplo
)

REM Actualizar configuración en .env
powershell -Command "
$envContent = Get-Content 'backend\.env' -Raw;
$envContent = $envContent -replace 'DB_PASS=.*', 'DB_PASS=%POSTGRES_PASSWORD%';
$envContent = $envContent -replace 'JWT_SECRET=.*', 'JWT_SECRET=ruleta_tiktok_jwt_secret_super_seguro_2024';
Set-Content 'backend\.env' -Value $envContent -NoNewline
"

echo ✅ Variables de entorno configuradas
echo.

REM Ejecutar migraciones
echo 🏗️ Ejecutando migraciones de base de datos...
cd backend
set PGPASSWORD=%POSTGRES_PASSWORD%
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ruleta_tiktok',
  password: '%POSTGRES_PASSWORD%',
  port: 5432,
});
const sql = fs.readFileSync('../db/schema.sql', 'utf8');
pool.query(sql).then(() => {
  console.log('✅ Migraciones ejecutadas exitosamente');
  process.exit(0);
}).catch((err) => {
  console.log('❌ Error en migraciones:', err.message);
  process.exit(1);
});
"

if %ERRORLEVEL% equ 0 (
    echo ✅ Base de datos configurada completamente
) else (
    echo ❌ Error configurando base de datos
    pause
    exit /b 1
)

cd ..

echo.
echo 🎉 ¡PostgreSQL configurado exitosamente!
echo.
echo 📊 Configuración completada:
echo    Host: localhost
echo    Puerto: 5432
echo    Base de datos: ruleta_tiktok
echo    Usuario: postgres
echo    Ruta PostgreSQL: %POSTGRES_PATH%
echo.
echo 🚀 Ahora puedes ejecutar: npm run dev
echo.
pause
