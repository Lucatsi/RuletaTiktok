const { WebcastPushConnection } = require('tiktok-live-connector');
const Game = require('../models/Game');

class TikTokService {
  constructor(io) {
    this.io = io;
    this.connections = new Map(); // userId -> connection
    this.gameSettings = new Map(); // userId -> settings
  this.status = new Map(); // userId -> { connected, username, viewerCount }
  }

  async connectToLive(tiktokUsername, userId) {
    try {
      // Evitar múltiples conexiones simultáneas para el mismo usuario.
      // Si ya existe, solo emitir el estado actual para la sala para que nuevos clientes lo reciban.
      if (this.connections.has(userId)) {
        console.log(`⏭️ Ya hay una conexión activa para userId=${userId}, omitiendo reconexión y emitiendo estado actual.`);
        const st = this.status.get(userId) || { connected: true, username: tiktokUsername, viewerCount: 0 };
        this.io.to(`game-${userId}`).emit('tiktok-connected', {
          connected: true,
          username: st.username || tiktokUsername,
          status: { info: 'already-connected' },
          viewerCount: Number(st.viewerCount || 0)
        });
        return;
      }

      // Sanear username: quitar @, espacios y usar uniqueId en minúsculas
      const uniqueId = (tiktokUsername || '')
        .toString()
        .trim()
        .replace(/^@+/, '')
        .toLowerCase();

      console.log(`🔄 Conectando al live de @${uniqueId} para usuario ${userId}`);

      const tiktokLiveConnection = new WebcastPushConnection(uniqueId, {
        clientParams: {
          app_language: 'es-ES',
          device_platform: 'web',
          region: 'ES'
        },
        enableWebsocketUpgrade: false, // ❌ TikTok ya no soporta WebSocket upgrade
        fetchRoomInfoOnConnect: true,
        requestPollingIntervalMs: 1000 // Usar polling cada 1 segundo
      });

      // Eventos de TikTok Live
  tiktokLiveConnection.connect().then(state => {
        console.log(`✅ Conectado al live de @${uniqueId}`);
        console.log('📊 Estado de la conexión:', JSON.stringify(state, null, 2));
        
        // Intentar obtener viewers iniciales de roomInfo
        const initialViewers = (
          state?.roomInfo?.viewer_count ||
          state?.roomInfo?.viewerCount ||
          state?.roomInfo?.user_count ||
          state?.roomInfo?.data?.userCount ||
          state?.data?.userCount ||
          0
        );

        console.log(`👥 Viewers iniciales: ${initialViewers}`);

  // Guardar estado actual
  this.status.set(userId, { connected: true, username: uniqueId, viewerCount: Number(initialViewers || 0) });

  this.io.to(`game-${userId}`).emit('tiktok-connected', {
          connected: true,
          username: uniqueId,
          status: state,
          viewerCount: initialViewers
        });
      }).catch(err => {
        console.error('❌ Error conectando al live de @' + uniqueId);
        console.error('❌ Tipo de error:', err?.name);
        console.error('❌ Mensaje de error:', err?.message);
        console.error('❌ Detalles completos:', err);
        
        // Mensaje de error más específico
        let errorMessage = 'No se pudo conectar al live de TikTok.';
        
        if (err?.message?.includes('LIVE has ended') || err?.message?.includes('not found')) {
          errorMessage = `❌ El usuario @${uniqueId} no está en LIVE o no existe. Verifica:\n1. Que estés transmitiendo EN VIVO\n2. Que el nombre de usuario sea correcto (sin @)\n3. Que tu cuenta sea pública`;
        } else if (err?.message?.includes('rate limit')) {
          errorMessage = 'Demasiados intentos de conexión. Espera 1 minuto e intenta de nuevo.';
        } else if (err?.message?.includes('region')) {
          errorMessage = 'El LIVE no está disponible en esta región o está restringido.';
        }
        
        this.io.to(`game-${userId}`).emit('tiktok-error', {
          error: errorMessage,
          code: err?.exception?.message || err?.info || err?.message || 'connect_error',
          details: err?.message
        });
      });

      // Evento: regalo recibido
      tiktokLiveConnection.on('gift', (data) => {
        try {
          // Evitar duplicados de racha: para regalos repetibles (giftType===1),
          // sólo emitir cuando la racha termina (repeatEnd === true).
          if (Number(data.giftType) === 1 && !data.repeatEnd) {
            return;
          }

          console.log(`🎁 Regalo: ${data.giftName} x${data.repeatCount} de @${data.uniqueId} ${data.repeatEnd ? '(final racha)' : ''}`);

          const giftData = {
            type: 'gift',
            donorName: data.uniqueId,
            displayName: data.nickname,
            username: data.uniqueId,
            giftName: data.giftName,
            giftId: data.giftId,
            giftCount: data.repeatCount,
            coinsValue: data.diamondCount * data.repeatCount,
            giftType: data.giftType,
            repeatEnd: !!data.repeatEnd,
            timestamp: Date.now()
          };

          // Enviar regalo al frontend en tiempo real
          this.io.to(`game-${userId}`).emit('tiktok-gift', giftData);

          // Guardar en base de datos si hay una sesión activa
          this.recordDonationIfActive(userId, giftData);
        } catch (err) {
          console.error('Error procesando gift:', err);
        }
      });

      // Evento: comentario
    tiktokLiveConnection.on('chat', (data) => {
        console.log(`💬 ${data.uniqueId}: ${data.comment}`);
        
        this.io.to(`game-${userId}`).emit('tiktok-chat', {
          type: 'chat',
      username: data.uniqueId,
      displayName: data.nickname,
          message: data.comment,
          timestamp: Date.now()
        });
      });

      // Evento: viewers (conteo en tiempo real)
      tiktokLiveConnection.on('roomUser', (data) => {
        const vc = Number(data?.viewerCount ?? 0);
        const st = this.status.get(userId) || { connected: true, username: uniqueId, viewerCount: 0 };
        st.viewerCount = vc;
        this.status.set(userId, st);
        this.io.to(`game-${userId}`).emit('tiktok-viewers', {
          type: 'viewers',
          viewerCount: vc,
          timestamp: Date.now()
        });
      });

      // Evento: seguidor nuevo
    tiktokLiveConnection.on('follow', (data) => {
        console.log(`👤 Nuevo seguidor: @${data.uniqueId}`);
        
        this.io.to(`game-${userId}`).emit('tiktok-follow', {
          type: 'follow',
      username: data.uniqueId,
      displayName: data.nickname,
          timestamp: Date.now()
        });
      });

      // Evento: like
    tiktokLiveConnection.on('like', (data) => {
        this.io.to(`game-${userId}`).emit('tiktok-like', {
          type: 'like',
      username: data.uniqueId,
      displayName: data.nickname,
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
      displayName: data.nickname,
          timestamp: Date.now()
        });
      });

      // Evento: desconexión
      tiktokLiveConnection.on('disconnected', () => {
        console.log(`🔌 Desconectado del live de @${uniqueId}`);
        this.connections.delete(userId);
        this.status.set(userId, { connected: false, username: uniqueId, viewerCount: 0 });
        
        this.io.to(`game-${userId}`).emit('tiktok-disconnected', {
          connected: false,
          message: 'Desconectado del live de TikTok'
        });
      });

      // Evento: error
      tiktokLiveConnection.on('error', (err) => {
        console.error(`❌ Error en conexión TikTok:`, err);
        
        this.io.to(`game-${userId}`).emit('tiktok-error', {
          error: err.message,
          code: err?.exception?.message || err?.info || 'error'
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

  // Emitir el estado actual a la sala
  emitCurrentStatus(userId) {
    const st = this.status.get(userId);
    if (st?.connected) {
      this.io.to(`game-${userId}`).emit('tiktok-connected', {
        connected: true,
        username: st.username,
        viewerCount: Number(st.viewerCount || 0)
      });
    } else {
      this.io.to(`game-${userId}`).emit('tiktok-disconnected', {
        connected: false
      });
    }
  }
}

module.exports = TikTokService;
