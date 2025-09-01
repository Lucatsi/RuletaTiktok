# 🎮 Ruleta TikTok - Plataforma de Juegos Interactivos

¡Bienvenido a **Ruleta TikTok**! Una plataforma completa para streamers que permite crear juegos interactivos que reaccionan en tiempo real a las donaciones de TikTok Live.

## 🌟 Características

- ✅ **Autenticación completa**: Registro, login y gestión de usuarios
- 🎯 **4 Juegos interactivos**: Ruleta, Disparos, Barra de Vida, Ranking de Donadores
- 📡 **Conexión en tiempo real** con TikTok Live usando WebSockets
- 🎨 **Fondo verde (Chroma Key)** para captura en TikTok Live Studio
- 📊 **Dashboard personalizable** con estadísticas y configuraciones
- 🎁 **Sistema de regalos** que detecta automáticamente las donaciones

## 🎮 Juegos Disponibles

### 🎰 Ruleta de la Suerte
- Gira automáticamente con cada donación
- Premios personalizables
- Efectos visuales y sonoros

### 🎯 Disparos al Avatar
- Cada donación dispara al avatar
- Sistema de vida dinámica
- Animaciones de impacto

### 💖 Barra de Vida
- Las donaciones aumentan/reducen vida
- Configuración de efectos por regalo
- Visualización en tiempo real

### 🏆 Ranking de Donadores
- Top 10 de donadores en vivo
- Actualización automática
- Estadísticas detalladas

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ instalado
- PostgreSQL instalado y ejecutándose
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/RuletaTiktok.git
cd RuletaTiktok
```

### 2. Configurar la base de datos

```bash
# Crear base de datos en PostgreSQL
psql -U postgres
CREATE DATABASE ruleta_tiktok;
\q
```

### 3. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Ejecutar migraciones
npm run migrate

# Iniciar servidor de desarrollo
npm run dev
```

### 4. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar aplicación de desarrollo
npm run dev
```

## 🔧 Configuración

### Variables de Entorno (Backend)

Edita el archivo `backend/.env`:

```env
PORT=3001
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruleta_tiktok
DB_USER=postgres
DB_PASS=tu_password_postgres
NODE_ENV=development
```

### Configuración del Frontend

El frontend se conecta automáticamente al backend en `http://localhost:3001`.

## 📖 Cómo Usar

### 1. Registro y Configuración

1. Abre `http://localhost:3000`
2. Regístrate con tu email y contraseña
3. En el dashboard, configura tu **usuario de TikTok** (sin @)

### 2. Usar los Juegos

1. **Selecciona un juego** desde el dashboard
2. **Abre el juego en una nueva pestaña**
3. **En TikTok Live Studio:**
   - Agrega fuente → "Captura de ventana"
   - Selecciona la pestaña del juego
   - Aplica filtro **Chroma Key** con color **#00FF00** (verde)
4. **¡Listo!** Los regalos de tus viewers activarán el juego automáticamente

### 3. Configurar TikTok Live Studio

Para capturar los juegos correctamente:

1. **Abrir TikTok Live Studio**
2. **Agregar fuente de video:**
   - Clic en "+" → "Captura de ventana"
   - Seleccionar la ventana/pestaña del juego
3. **Configurar Chroma Key:**
   - Clic derecho en la fuente → "Filtros"
   - Agregar "Chroma Key"
   - Color: **#00FF00** (Verde)
   - Tolerancia: 400-500
4. **Ajustar posición y tamaño** según necesites

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express**: Servidor API REST
- **Socket.io**: Comunicación en tiempo real
- **PostgreSQL**: Base de datos principal
- **JWT**: Autenticación y sesiones
- **tiktok-live-connector**: Conexión con TikTok Live

### Frontend
- **React 18**: Interfaz de usuario
- **Material-UI**: Componentes y diseño
- **Framer Motion**: Animaciones
- **Socket.io-client**: Cliente WebSocket
- **Vite**: Bundler y dev server

## 🎯 Eventos de TikTok Soportados

La plataforma reacciona a estos eventos de TikTok Live:

- 🎁 **Regalos/Gifts**: Activan todos los juegos
- 👤 **Seguidores**: Pueden activar efectos especiales
- 💬 **Comentarios**: Se muestran en tiempo real
- ❤️ **Likes**: Efectos visuales adicionales
- 📤 **Compartir**: Bonificaciones especiales

## 🚨 Solución de Problemas

### El juego no se conecta a TikTok

1. ✅ Verifica que hayas configurado tu usuario de TikTok
2. ✅ Asegúrate de estar en vivo en TikTok
3. ✅ El usuario debe estar público y accesible
4. ✅ Revisa la consola del navegador para errores

### Los regalos no se detectan

1. ✅ Verifica que el live esté activo
2. ✅ Asegúrate de que lleguen regalos reales
3. ✅ Revisa la conexión del WebSocket
4. ✅ Verifica que no haya errores en el servidor

### Problemas con Chroma Key

1. ✅ Usa exactamente el color **#00FF00**
2. ✅ Ajusta la tolerancia en TikTok Live Studio
3. ✅ Asegúrate de que no haya otras ventanas sobre el juego
4. ✅ Usa pantalla completa para mejor resultado

## 📊 Base de Datos

La aplicación usa PostgreSQL con estas tablas:

- **users**: Información de usuarios y configuraciones
- **games**: Sesiones de juego y estadísticas
- **donations**: Registro de todas las donaciones recibidas

## 🔐 Seguridad

- ✅ Autenticación JWT con expiración
- ✅ Rate limiting en API endpoints
- ✅ Validación de datos de entrada
- ✅ Sanitización de contenido de TikTok
- ✅ CORS configurado correctamente

## 🚀 Despliegue en Producción

### Backend
```bash
npm run build
NODE_ENV=production npm start
```

### Frontend
```bash
npm run build
# Subir carpeta dist/ a tu hosting
```

### Base de Datos
- Configura PostgreSQL en tu servidor
- Ejecuta las migraciones con `npm run migrate`
- Configura backup automático

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 🆘 Soporte

¿Tienes problemas? ¡Estamos aquí para ayudarte!

- 📧 Email: soporte@ruletattiktok.com
- 💬 Discord: [Enlace al servidor]
- 📖 Documentación: [docs.ruletattiktok.com]

## 🎉 ¡A Jugar!

¡Ya tienes todo listo para crear experiencias interactivas increíbles con tus viewers de TikTok! 

**Disfruta creando contenido único y diferenciado** 🚀
