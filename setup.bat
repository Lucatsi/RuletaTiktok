@echo off
echo.
echo ====================================
echo   RULETA TIKTOK - SETUP AUTOMATICO
echo ====================================
echo.

REM Verificar si Node.js esta instalado
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js no esta instalado. Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado
node --version

REM Verificar si PostgreSQL esta ejecutandose
echo 🔍 Verificando PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ⚠️  PostgreSQL no está ejecutándose o no está instalado.
    echo.
    choice /M "¿Quieres instalar/configurar PostgreSQL automáticamente"
    if !ERRORLEVEL! equ 1 (
        call install-postgresql.bat
    ) else (
        echo 📖 Instrucciones manuales:
        echo    1. Instala PostgreSQL desde: https://www.postgresql.org/download/
        echo    2. Crea la base de datos 'ruleta_tiktok'
        echo    3. Configura las credenciales en backend\.env
        pause
        exit /b 1
    )
)

echo.
echo 📦 Instalando dependencias del backend...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Error instalando dependencias del backend
    pause
    exit /b 1
)

echo.
echo 📦 Instalando dependencias del frontend...
cd ..\frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Error instalando dependencias del frontend
    pause
    exit /b 1
)

cd ..

REM Verificar si existe .env
if not exist "backend\.env" (
    echo.
    echo ⚙️  Configurando variables de entorno...
    copy "backend\.env.example" "backend\.env"
    echo.
    echo ⚠️  IMPORTANTE: Edita backend\.env con tus credenciales de PostgreSQL
    echo    Especialmente DB_PASS y JWT_SECRET
    echo.
    pause
)

echo.
echo 🗄️  Ejecutando migraciones de base de datos...
cd backend
call npm run migrate
if %ERRORLEVEL% neq 0 (
    echo ❌ Error ejecutando migraciones. Verifica tu configuracion de PostgreSQL.
    echo    1. Asegurate de que PostgreSQL este ejecutandose
    echo    2. Verifica las credenciales en backend\.env
    echo    3. Crea la base de datos 'ruleta_tiktok' si no existe
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ ¡Instalacion completada exitosamente!
echo.
echo 🚀 Para iniciar la aplicacion:
echo    npm run dev
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo.
echo 📖 Lee README.md para instrucciones completas
echo.
pause
