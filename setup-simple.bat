@echo off
echo Configurando PostgreSQL en disco D:...
echo.

echo Paso 1: Configurando PATH...
set PATH=D:\Program Files\PostgreSQL\bin;%PATH%

echo Paso 2: Creando usuario tiktok...
psql -U postgres -c "CREATE USER tiktok WITH PASSWORD 'tiktok123';" 2>nul
echo Usuario creado o ya existía.

echo Paso 3: Creando base de datos...
createdb -U postgres ruletiktok 2>nul
echo Base de datos creada o ya existía.

echo Paso 4: Dando permisos...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ruletiktok TO tiktok;"

echo Paso 5: Aplicando esquema...
psql -U postgres -d ruletiktok -f "database\schema.sql"

echo.
echo ¡Configuración completada!
echo.
echo Para probar la conexión:
echo psql -U tiktok -d ruletiktok -h localhost
echo Contraseña: tiktok123
pause
