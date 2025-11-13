# Variables de Entorno para Render

## 🔧 Configuración del Backend en Render

Ve a tu servicio en Render Dashboard y configura estas variables de entorno:

### Variables Requeridas:

```bash
# Base de Datos PostgreSQL
DB_HOST=dpg-xxxxxxxxxxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=ruleta_tiktok
DB_USER=ruleta_tiktok_user
DB_PASSWORD=tu-password-generado-por-render

# Servidor
PORT=5000
NODE_ENV=production

# Seguridad
JWT_SECRET=tu-jwt-secret-super-seguro-cambialo-por-algo-aleatorio-largo

# Frontend URL (Opcional pero recomendado)
FRONTEND_URL=https://tu-app.netlify.app
```

---

## 📝 Cómo obtener las credenciales de PostgreSQL en Render:

1. Ve a tu **Dashboard de Render**: https://dashboard.render.com
2. Busca tu **PostgreSQL Database**
3. En la pestaña **Info**, encontrarás:
   - **Hostname** (DB_HOST)
   - **Port** (DB_PORT) - normalmente es 5432
   - **Database** (DB_NAME)
   - **Username** (DB_USER)
   - **Password** (DB_PASSWORD)

---

## ⚙️ Cómo configurar variables de entorno en Render:

1. Ve a tu servicio de **Web Service** (backend)
2. Click en **Environment** en el menú lateral
3. Click en **Add Environment Variable**
4. Agrega cada variable con su valor
5. Click en **Save Changes**
6. El servicio se redesplegarará automáticamente

---

## ⚠️ IMPORTANTE:

- **JWT_SECRET**: Genera una cadena aleatoria larga (mínimo 32 caracteres)
  - Puedes generarla en: https://www.random.org/strings/
  - O ejecutar en terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- **FRONTEND_URL**: Debe ser la URL exacta de tu sitio en Netlify
  - Ejemplo: `https://roulette-tiktok.netlify.app`
  - NO incluyas `/` al final

---

## ✅ Verificación:

Después de configurar las variables:

1. Espera que Render redespliegue (2-3 minutos)
2. Ve a los **Logs** de tu servicio
3. Deberías ver:
   ```
   🚀 Servidor ejecutándose en puerto 5000
   ✅ Conexión a PostgreSQL exitosa
   ```

Si ves errores de conexión a la BD, verifica que las credenciales sean correctas.
