@echo off
setlocal

echo ==============================================================
echo          CONFIGURACIÓN POSTGRESQL - DISCO D:
echo ==============================================================

set PGPATH=D:\Program Files\PostgreSQL\bin
set PGUSER=postgres
set PGPORT=5432
set PGHOST=localhost

echo Verificando PostgreSQL...
"%PGPATH%\pg_isready" -h %PGHOST% -p %PGPORT%
if errorlevel 1 (
    echo ERROR: PostgreSQL no está corriendo
    echo Iniciando servicio PostgreSQL...
    net start postgresql
    timeout /t 3 /nobreak >nul
    "%PGPATH%\pg_isready" -h %PGHOST% -p %PGPORT%
    if errorlevel 1 (
        echo ERROR: No se pudo iniciar PostgreSQL
        pause
        exit /b 1
    )
)

echo PostgreSQL está corriendo correctamente!
echo.

echo Creando base de datos 'ruletiktok'...
"%PGPATH%\createdb" -U %PGUSER% -h %PGHOST% -p %PGPORT% ruletiktok 2>nul
if not errorlevel 1 (
    echo Base de datos 'ruletiktok' creada exitosamente!
) else (
    echo Base de datos 'ruletiktok' ya existe o se creó correctamente.
)

echo.
echo Aplicando configuraciones de usuario...

echo -- Crear usuario tiktok si no existe > temp_user.sql
echo DO $$ >> temp_user.sql
echo BEGIN >> temp_user.sql
echo    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tiktok') THEN >> temp_user.sql
echo       CREATE USER tiktok WITH PASSWORD 'tiktok123'; >> temp_user.sql
echo    END IF; >> temp_user.sql
echo END >> temp_user.sql
echo $$; >> temp_user.sql
echo. >> temp_user.sql
echo -- Dar permisos al usuario >> temp_user.sql
echo GRANT ALL PRIVILEGES ON DATABASE ruletiktok TO tiktok; >> temp_user.sql

"%PGPATH%\psql" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d ruletiktok -f temp_user.sql
del temp_user.sql

echo.
echo Aplicando esquema de base de datos...
"%PGPATH%\psql" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d ruletiktok -f "database\schema.sql"
if errorlevel 1 (
    echo ADVERTENCIA: Error al aplicar esquema. Continuando...
)

echo.
echo Configurando variables de entorno para esta sesión...
set PATH=%PGPATH%;%PATH%
set PGUSER=postgres
set PGPASSWORD=
set DATABASE_URL=postgresql://tiktok:tiktok123@localhost:5432/ruletiktok

echo.
echo ==============================================================
echo                  CONFIGURACIÓN COMPLETADA
echo ==============================================================
echo.
echo PostgreSQL Path: %PGPATH%
echo Base de datos: ruletiktok
echo Usuario: tiktok / tiktok123
echo URL: %DATABASE_URL%
echo.
echo Para usar PostgreSQL en otros terminales, ejecuta:
echo set PATH=%PGPATH%;%%PATH%%
echo.
echo Probando conexión final...
"%PGPATH%\psql" -U tiktok -h %PGHOST% -p %PGPORT% -d ruletiktok -c "SELECT 'Conexión exitosa!' as resultado;"

echo.
pause
