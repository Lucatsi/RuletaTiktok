# 🐘 Instalar PostgreSQL en Windows

## Opción 1: Descarga Directa (RECOMENDADO)

1. **Descarga el instalador**:
   - Ve a: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Descarga la versión 16.x para Windows x86-64

2. **Ejecuta el instalador**:
   - Doble clic en el archivo `.exe` descargado
   - Durante la instalación:
     - **Contraseña para postgres**: Usa `postgres` (o la que pusiste en `.env`)
     - **Puerto**: 5432 (dejar por defecto)
     - **Locale**: Default locale
   
3. **Después de instalar**:
   ```powershell
   # Verifica que el servicio esté corriendo
   Get-Service -Name postgresql*
   
   # Si no está corriendo, inícialo
   Start-Service -Name postgresql-x64-16  # (el nombre puede variar)
   ```

4. **Crea la base de datos**:
   ```powershell
   cd c:\Users\alexa\OneDrive\Documentos\GitHub\RuletaTiktok
   npm run migrate
   ```

## Opción 2: Usar PostgreSQL en Docker (Alternativa)

Si prefieres usar Docker:

```powershell
docker run --name ruleta-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ruleta_tiktok -p 5432:5432 -d postgres:16
```

Luego ejecuta las migraciones:
```powershell
npm run migrate
```

## Opción 3: Usar la base de datos de Render (Producción)

Si no quieres instalar localmente, puedes usar la base de datos que ya creamos en Render:

1. Ve al archivo `backend/.env`
2. Reemplaza las credenciales locales con las de Render:

```env
DB_USER=ruleta_tiktok_db_user
DB_HOST=dpg-d473eaur433s738tt8p0-a.oregon-postgres.render.com
DB_NAME=ruleta_tiktok_db
DB_PASSWORD=nldDYPkcBQQR4sRbVcG8GEOSHO4VbJVP
DB_PORT=5432
```

⚠️ **NOTA**: Esto hará que tu desarrollo local use la base de datos de producción.

## Verificar que funciona

Después de cualquier opción, reinicia el servidor:

```powershell
npm run dev
```

Deberías ver:
```
✅ Conectado a PostgreSQL exitosamente
```

En lugar de:
```
❌ Error conectando a PostgreSQL
```
