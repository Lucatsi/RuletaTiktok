const { WebcastPushConnection } = require('tiktok-live-connector');
const Game = require('../models/Game');

class TikTokService {
  constructor(io) {
    this.io = io;
    this.connections = new Map(); // userId -> connection
    this.gameSettings = new Map(); // userId -> settings
  }

  async connectToLive(tiktokUsername, userId) {
    try {
      // Cerrar conexión existente si existe
      if (this.connections.has(userId)) {
        this.disconnectFromLive(userId);
      }

      console.log(`🔄 Conectando al live de @${tiktokUsername} para usuario ${userId}`);

      const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

      // Eventos de TikTok Live
      tiktokLiveConnection.connect().then(state => {
        console.log(`✅ Conectado al live de @${tiktokUsername}:`, state);
        
        this.io.to(`game-${userId}`).emit('tiktok-connected', {
          connected: true,
          username: tiktokUsername,
          status: state
        });
      }).catch(err => {
        console.error('❌ Error conectando al live:', err);
        this.io.to(`game-${userId}`).emit('tiktok-error', {
          error: 'No se pudo conectar al live. Verifica que esté en vivo.'
        });
      });

      // Evento: regalo recibido
      tiktokLiveConnection.on('gift', (data) => {
        console.log(`🎁 Regalo: ${data.giftName} x${data.repeatCount} de @${data.uniqueId}`);
        
        const giftData = {
          type: 'gift',
          donorName: data.uniqueId,
          giftName: data.giftName,
          giftId: data.giftId,
          giftCount: data.repeatCount,
          coinsValue: data.diamondCount * data.repeatCount,
          timestamp: Date.now()
        };

        // Enviar regalo al frontend en tiempo real
        this.io.to(`game-${userId}`).emit('tiktok-gift', giftData);
        
        // Guardar en base de datos si hay una sesión activa
        this.recordDonationIfActive(userId, giftData);
      });

      // Evento: comentario
      tiktokLiveConnection.on('chat', (data) => {
        console.log(`💬 ${data.uniqueId}: ${data.comment}`);
        
        this.io.to(`game-${userId}`).emit('tiktok-chat', {
          type: 'chat',
          username: data.uniqueId,
          message: data.comment,
          timestamp: Date.now()
        });
      });

      // Evento: seguidor nuevo
      tiktokLiveConnection.on('follow', (data) => {
        console.log(`👤 Nuevo seguidor: @${data.uniqueId}`);
        
        this.io.to(`game-${userId}`).emit('tiktok-follow', {
          type: 'follow',
          username: data.uniqueId,
          timestamp: Date.now()
        });
      });

      // Evento: like
      tiktokLiveConnection.on('like', (data) => {
        this.io.to(`game-${userId}`).emit('tiktok-like', {
          type: 'like',
          username: data.uniqueId,
          likeCount: data.likeCount,
          totalLikeCount: data.totalLikeCount,
          timestamp: Date.now()
        });
      });

      // Evento: share
      tiktokLiveConnection.on('share', (data) => {
        console.log(`📤 Share de @${data.uniqueId}`);
        
        this.io.to(`game-${userId}`).emit('tiktok-share', {
          type: 'share',
          username: data.uniqueId,
          timestamp: Date.now()
        });
      });

      // Evento: desconexión
      tiktokLiveConnection.on('disconnected', () => {
        console.log(`🔌 Desconectado del live de @${tiktokUsername}`);
        this.connections.delete(userId);
        
        this.io.to(`game-${userId}`).emit('tiktok-disconnected', {
          connected: false,
          message: 'Desconectado del live de TikTok'
        });
      });

      // Evento: error
      tiktokLiveConnection.on('error', (err) => {
        console.error(`❌ Error en conexión TikTok:`, err);
        
        this.io.to(`game-${userId}`).emit('tiktok-error', {
          error: err.message
        });
      });

      // Guardar conexión
      this.connections.set(userId, tiktokLiveConnection);

    } catch (error) {
      console.error('Error en connectToLive:', error);
      this.io.to(`game-${userId}`).emit('tiktok-error', {
        error: 'Error al conectar con TikTok Live'
      });
    }
  }

  disconnectFromLive(userId) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(userId);
      console.log(`🔌 Desconectado del live para usuario ${userId}`);
    }
  }

  // Registrar donación si hay sesión activa
  async recordDonationIfActive(userId, giftData) {
    try {
      // Buscar sesión activa para cualquier tipo de juego
      const gameTypes = ['ruleta', 'disparos', 'vida', 'ranking'];
      
      for (const gameType of gameTypes) {
        const activeSession = await Game.getActiveSession(userId, gameType);
        
        if (activeSession) {
          await Game.recordDonation(activeSession.id, {
            donorName: giftData.donorName,
            giftType: giftData.giftName,
            giftCount: giftData.giftCount,
            coinsValue: giftData.coinsValue
          });
          
          console.log(`💾 Donación guardada en sesión ${activeSession.id}`);
          break;
        }
      }
    } catch (error) {
      console.error('Error guardando donación:', error);
    }
  }

  // Obtener estadísticas de conexiones activas
  getStats() {
    return {
      activeConnections: this.connections.size,
      connectedUsers: Array.from(this.connections.keys())
    };
  }
}

module.exports = TikTokService;
