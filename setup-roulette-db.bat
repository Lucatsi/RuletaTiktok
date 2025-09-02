@echo off
echo Configurando base de datos para sistema de historial de ruletas...
echo.

REM Conectar a PostgreSQL y ejecutar los scripts
psql -h 127.0.0.1 -U postgres -d ruletiktok -f "database\roulette-history.sql"

if %ERRORLEVEL% neq 0 (
    echo Error al ejecutar el script de historial de ruletas
    pause
    exit /b 1
)

echo.
echo ¡Base de datos configurada correctamente!
echo Las siguientes tablas fueron creadas/actualizadas:
echo - roulette_configurations
echo - roulette_history
echo - roulette_session_stats
echo.
pause
