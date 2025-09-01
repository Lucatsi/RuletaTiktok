import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado del servidor WebSocket:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Unirse a una sala de juego
  joinGame(gameType, userId, tiktokUsername = null) {
    if (!this.socket) this.connect();
    
    this.socket.emit('join-game', {
      gameType,
      userId,
      tiktokUsername,
    });
  }

  // Desconectar del live de TikTok
  disconnectTikTok(userId) {
    if (!this.socket) return;
    
    this.socket.emit('disconnect-tiktok', { userId });
  }

  // Escuchar eventos de TikTok
  onTikTokGift(callback) {
    this.addEventListener('tiktok-gift', callback);
  }

  onTikTokChat(callback) {
    this.addEventListener('tiktok-chat', callback);
  }

  onTikTokFollow(callback) {
    this.addEventListener('tiktok-follow', callback);
  }

  onTikTokLike(callback) {
    this.addEventListener('tiktok-like', callback);
  }

  onTikTokShare(callback) {
    this.addEventListener('tiktok-share', callback);
  }

  onTikTokConnected(callback) {
    this.addEventListener('tiktok-connected', callback);
  }

  onTikTokDisconnected(callback) {
    this.addEventListener('tiktok-disconnected', callback);
  }

  onTikTokError(callback) {
    this.addEventListener('tiktok-error', callback);
  }

  // Método genérico para agregar event listeners
  addEventListener(event, callback) {
    if (!this.socket) this.connect();
    
    this.socket.on(event, callback);
    
    // Guardar referencia para poder remover después
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remover event listeners
  removeEventListener(event, callback) {
    if (!this.socket) return;
    
    this.socket.off(event, callback);
    
    // Remover de la lista de listeners
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Limpiar todos los listeners de un evento
  removeAllEventListeners(event) {
    if (!this.socket) return;
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        this.socket.off(event, callback);
      });
      this.listeners.delete(event);
    }
  }

  // Obtener estado de conexión
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Exportar instancia singleton
export default new SocketService();
