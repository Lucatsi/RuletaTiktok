import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  this.lastJoinData = null; // Para re-unirse tras reconexión
  }

  connect() {
    if (this.socket?.connected) return this.socket;

    // Usar la misma URL del backend (sin /api)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const WS_URL = API_URL.replace('/api', '');
    
    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      // Re-unirse a la sala de juego automáticamente si hay datos previos
      if (this.lastJoinData) {
        this.socket.emit('join-game', this.lastJoinData);
      }
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
    
  this.lastJoinData = { gameType, userId, tiktokUsername };
  this.socket.emit('join-game', this.lastJoinData);
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

  onTikTokViewers(callback) {
    this.addEventListener('tiktok-viewers', callback);
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

  // Obtener instancia del socket
  getSocket() {
    if (!this.socket) {
      this.connect();
    }
    return this.socket;
  }
}

// Exportar instancia singleton
export default new SocketService();
