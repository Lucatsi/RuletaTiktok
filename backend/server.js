const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gamesRoutes = require('./routes/games');
const rouletteRoutes = require('./routes/roulette');
const TikTokService = require('./services/tiktokService');

const app = express();
const server = http.createServer(app);

// Configuración de CORS - permite localhost y dominios de producción
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173', // Vite dev server
  'https://tiktokgamer.netlify.app',
  process.env.FRONTEND_URL, // URL del frontend desde variable de entorno
].filter(Boolean); // Eliminar valores undefined

// Función para verificar si el origen está permitido
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Permitir requests sin origin
  if (allowedOrigins.includes(origin)) return true;
  // Permitir cualquier dominio de Netlify
  if (origin.endsWith('.netlify.app')) return true;
  // Permitir en desarrollo
  if (process.env.NODE_ENV === 'development') return true;
  return false;
};

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middlewares de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana por IP
});
app.use('/api/', limiter);

// CORS mejorado
app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ Origen bloqueado por CORS: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

// Parser de JSON
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/roulette', rouletteRoutes);

// Instancia del servicio de TikTok
const tiktokService = new TikTokService(io);

// Socket.io para conexiones en tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Cuando un streamer se conecta a un juego específico
  socket.on('join-game', (data) => {
    const { gameType, userId, tiktokUsername } = data;
    socket.join(`game-${userId}`);
    
    console.log(`Usuario ${userId} se unió al juego ${gameType}`);
    
    // Si proporciona username de TikTok, conectar al live
    if (tiktokUsername) {
      tiktokService.connectToLive(tiktokUsername, userId);
    }

    // Emitir estado actual al nuevo socket (aunque ya exista la conexión)
    if (userId) {
      try { tiktokService.emitCurrentStatus(userId); } catch (_) {}
    }
  });

  // Desconectar del live de TikTok
  socket.on('disconnect-tiktok', (data) => {
    const { userId } = data;
    tiktokService.disconnectFromLive(userId);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Dashboard: http://localhost:3001`);
  console.log(`🎮 API: http://localhost:${PORT}`);
});
