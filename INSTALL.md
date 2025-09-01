# 🎮 Instrucciones de Instalación Paso a Paso

## ⚠️ Prerrequisitos

Antes de empezar, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior)
   - Descarga desde: https://nodejs.org/
   - Verifica con: `node --version`

2. **PostgreSQL** (versión 12 o superior)
   - Descarga desde: https://www.postgresql.org/download/
   - Durante la instalación, recuerda la contraseña del usuario `postgres`

3. **Git**
   - Descarga desde: https://git-scm.com/

## 📋 Instalación Rápida

### Opción 1: Instalación Automática (Recomendada)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/RuletaTiktok.git
cd RuletaTiktok

# 2. Instalar dependencias de ambos proyectos
npm run install-all

# 3. Configurar base de datos (ver sección siguiente)

# 4. Ejecutar migraciones
npm run migrate

# 5. Iniciar ambos servidores
npm run dev
```

### Opción 2: Instalación Manual

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/RuletaTiktok.git
cd RuletaTiktok

# 2. Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run migrate
npm run dev

# 3. Frontend (en otra terminal)
cd ../frontend
npm install
npm run dev
```

## 🗄️ Configuración de Base de Datos

### 1. Crear la Base de Datos

```sql
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE ruleta_tiktok;

# Verificar creación
\l

# Salir
\q
```

### 2. Configurar Variables de Entorno

Edita `backend/.env`:

```env
PORT=3001
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_min_32_caracteres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruleta_tiktok
DB_USER=postgres
DB_PASS=tu_password_de_postgres
NODE_ENV=development
```

### 3. Ejecutar Migraciones

```bash
cd backend
npm run migrate
```

## 🚀 Primera Ejecución

1. **Iniciar los servidores:**
   ```bash
   npm run dev
   ```

2. **Abrir en navegador:**
   - Frontend: http://localhost:3000
   - API Backend: http://localhost:3001

3. **Crear tu primera cuenta:**
   - Ve a http://localhost:3000
   - Clic en "Regístrate aquí"
   - Completa el formulario

4. **Configurar TikTok:**
   - En el dashboard, clic en ⚙️ "Configuraciones"
   - Ingresa tu usuario de TikTok (sin @)
   - Guardar

## 🎮 Probar los Juegos

1. **Seleccionar un juego** desde el dashboard
2. **Abrir en nueva pestaña** (importante para captura)
3. **Configurar TikTok Live Studio:**
   - Agregar fuente → "Captura de ventana"
   - Seleccionar pestaña del juego
   - Aplicar Chroma Key con color **#00FF00**

## ⚠️ Problemas Comunes

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté ejecutándose
# Windows:
services.msc → PostgreSQL

# Verificar credenciales en .env
# Probar conexión manual:
psql -U postgres -h localhost -d ruleta_tiktok
```

### Error: "Port 3000 is already in use"
```bash
# Matar proceso en puerto 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# O cambiar puerto en vite.config.js
```

### Error: "tiktok-live-connector"
```bash
# Reinstalar dependencia
cd backend
npm uninstall tiktok-live-connector
npm install tiktok-live-connector@latest
```

### No se detectan regalos de TikTok
1. ✅ Verifica que estés en vivo
2. ✅ Usuario de TikTok público
3. ✅ Usuario configurado correctamente (sin @)
4. ✅ Regalos reales de usuarios reales

## 📱 Configuración de TikTok Live Studio

### Pasos Detallados:

1. **Abrir TikTok Live Studio**
2. **Configurar escena:**
   - Clic en "+" para agregar fuente
   - Seleccionar "Captura de ventana"
   - Elegir la ventana del juego (debe estar en pestaña separada)

3. **Aplicar Chroma Key:**
   - Clic derecho en la fuente → "Filtros"
   - Agregar "Chroma Key" o "Filtro de color"
   - **Color:** #00FF00 (Verde puro)
   - **Tolerancia:** 400-500
   - **Suavizado:** 100-200

4. **Ajustar posición:**
   - Redimensionar y posicionar según necesites
   - El juego debe quedar transparente excepto los elementos

## 📊 Estructura de Archivos

```
RuletaTiktok/
├── backend/              # Servidor Node.js
│   ├── models/          # Modelos de base de datos
│   ├── routes/          # Rutas de API
│   ├── services/        # Servicios (TikTok, etc.)
│   ├── middleware/      # Middlewares
│   └── server.js        # Servidor principal
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── services/    # Servicios de API
│   │   └── contexts/    # Contextos de React
├── db/                  # Scripts de base de datos
└── README.md
```

## 🆘 Obtener Ayuda

Si tienes problemas:

1. 📖 Revisa este archivo completo
2. 🔍 Busca en los Issues de GitHub
3. 💬 Crea un nuevo Issue con:
   - Sistema operativo
   - Versión de Node.js
   - Error completo con stack trace
   - Pasos que realizaste

## ✅ Checklist de Verificación

Antes de reportar problemas, verifica:

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL ejecutándose
- [ ] Base de datos creada
- [ ] Variables .env configuradas
- [ ] Migraciones ejecutadas
- [ ] Puertos 3000 y 3001 libres
- [ ] Usuario TikTok configurado
- [ ] Navegador actualizado

¡Listo para empezar a crear contenido interactivo único! 🎉
