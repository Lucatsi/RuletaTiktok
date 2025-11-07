# 🚀 Guía de Despliegue - Ruleta TikTok

## ⚠️ Problema Actual
El frontend en Netlify intenta conectarse a `localhost:5000` que solo existe en tu computadora.

## 📝 Solución: Desplegar Backend + Configurar Variables

---

## OPCIÓN 1: Desplegar en Render (Recomendado - Gratis)

### Paso 1: Crear cuenta en Render
1. Ve a https://render.com
2. Crea una cuenta con GitHub

### Paso 2: Crear PostgreSQL Database
1. En Render Dashboard → "New +" → "PostgreSQL"
2. Nombre: `ruleta-tiktok-db`
3. Plan: **Free**
4. Crea la base de datos
5. **Copia la "External Database URL"** (la necesitarás)

### Paso 3: Desplegar el Backend
1. En Render Dashboard → "New +" → "Web Service"
2. Conecta tu repositorio de GitHub: `Lucatsi/RuletaTiktok`
3. Configuración:
   - **Name**: `ruleta-tiktok-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

4. **Variables de Entorno** (Add Environment Variables):
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<pega-la-url-de-postgresql-aqui>
   JWT_SECRET=tu-secreto-super-seguro-cambia-esto-123456
   CORS_ORIGIN=https://tiktokgamer.netlify.app
   ```

5. Click en "Create Web Service"
6. **Espera** a que se despliegue (5-10 minutos)
7. **Copia la URL** que te dan (ejemplo: `https://ruleta-tiktok-api.onrender.com`)

### Paso 4: Actualizar CORS en Backend
**Necesitarás actualizar el archivo backend/server.js** para permitir tu dominio de Netlify.

---

## OPCIÓN 2: Backend Local + ngrok (Temporal para pruebas)

Si solo quieres probar rápido:

1. Instala ngrok: https://ngrok.com/download
2. Ejecuta tu backend local: `cd backend && node server.js`
3. En otra terminal: `ngrok http 5000`
4. Copia la URL https que te da (ej: `https://abc123.ngrok.io`)
5. Usa esa URL en Netlify

---

## 🔧 Configurar Netlify (Después de desplegar backend)

### En tu Dashboard de Netlify:
1. Ve a tu sitio → **Site settings**
2. **Build & deploy** → **Environment variables**
3. Agrega esta variable:
   ```
   VITE_API_URL=https://tu-backend-url.onrender.com/api
   ```
   (Reemplaza con tu URL real del backend)

4. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## ✅ Verificar que funciona

1. Ve a https://tiktokgamer.netlify.app
2. Abre la consola del navegador (F12)
3. Intenta registrarte
4. NO deberías ver errores de "localhost"

---

## 🆘 Si sigues teniendo problemas

Dame la URL de tu backend desplegado y te ayudo a configurar todo.

## 📌 Importante
- El tier gratis de Render se duerme después de 15 min sin uso
- La primera request puede tardar 30-60 segundos en despertar
- Para producción real, considera un plan de pago o Railway/Heroku
