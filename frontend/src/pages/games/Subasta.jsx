import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import gamesService from '../../services/gamesService';
import TikTokNotification from '../../components/TikTokNotification';
import toast from 'react-hot-toast';

const Subasta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Estados de la subasta
  const [auctionItem, setAuctionItem] = useState('');
  const [auctionActive, setAuctionActive] = useState(false);
  const [bids, setBids] = useState([]);
  const [highestBid, setHighestBid] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Configuración
  const [showConfig, setShowConfig] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState(60);
  const [minimumBid, setMinimumBid] = useState(100);

  const [stats, setStats] = useState({
    totalBids: 0,
    totalCoins: 0,
    participants: 0
  });

  useEffect(() => {
    initializeGame();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, []);

  // Timer de la subasta
  useEffect(() => {
    let timer;
    if (auctionActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endAuction();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [auctionActive, timeRemaining]);

  const initializeGame = async () => {
    try {
      const response = await gamesService.startGame('subasta', {
        duration: auctionDuration,
        minimumBid: minimumBid
      });
      setGameSession(response.gameSession);
      
      socketService.connect();
      socketService.joinGame('subasta', user.id, user.tiktokUsername);
      
      toast.success('¡Sistema de subasta iniciado!');
    } catch (error) {
      toast.error('Error iniciando el juego');
    }
  };

  const setupSocketListeners = () => {
    socketService.onTikTokConnected((data) => {
      setConnected(true);
      toast.success(`¡Conectado al live de @${data.username}!`);
    });

    socketService.onTikTokDisconnected(() => {
      setConnected(false);
      toast.error('Desconectado del live de TikTok');
    });

    socketService.onTikTokError((data) => {
      toast.error(data.error);
    });

    socketService.onTikTokGift((giftData) => {
      if (auctionActive) {
        processBid(giftData);
      }
      setNotification(giftData);
      setTimeout(() => setNotification(null), 3000);
    });
  };

  const cleanup = () => {
    socketService.removeAllEventListeners('tiktok-connected');
    socketService.removeAllEventListeners('tiktok-disconnected');
    socketService.removeAllEventListeners('tiktok-error');
    socketService.removeAllEventListeners('tiktok-gift');
    
    if (gameSession) {
      gamesService.endGame(gameSession.id, stats);
    }
  };

  const startAuction = () => {
    if (!auctionItem.trim()) {
      toast.error('¡Escribe qué vas a subastar!');
      return;
    }
    
    setBids([]);
    setHighestBid(null);
    setTimeRemaining(auctionDuration);
    setAuctionActive(true);
    setAuctionEnded(false);
    setWinner(null);
    setShowConfig(false);
    
    toast.success(`¡Subasta iniciada: ${auctionItem}!`);
  };

  const endAuction = () => {
    setAuctionActive(false);
    setAuctionEnded(true);
    
    if (highestBid) {
      setWinner(highestBid);
      toast.success(`🎉 ¡${highestBid.bidder} ganó con ${highestBid.amount} monedas!`);
      
      // Celebración
      setTimeout(() => {
        setAuctionEnded(false);
        setWinner(null);
      }, 10000);
    } else {
      toast.error('No hubo ofertas en esta subasta');
      setTimeout(() => {
        setAuctionEnded(false);
      }, 3000);
    }
  };

  const processBid = (giftData) => {
    const { donorName, coinsValue } = giftData;
    
    // Validar oferta mínima
    if (coinsValue < minimumBid) {
      return;
    }
    
    // Validar que sea mayor a la oferta actual
    if (highestBid && coinsValue <= highestBid.amount) {
      return;
    }
    
    const newBid = {
      bidder: donorName,
      amount: coinsValue,
      timestamp: Date.now(),
      isNew: true
    };
    
    setHighestBid(newBid);
    setBids(prev => [newBid, ...prev].slice(0, 5));
    
    // Actualizar stats
    setStats(prev => ({
      totalBids: prev.totalBids + 1,
      totalCoins: prev.totalCoins + coinsValue,
      participants: new Set([...bids.map(b => b.bidder), donorName]).size
    }));
    
    // Marcar como no nuevo después de 2 segundos
    setTimeout(() => {
      setHighestBid(prev => prev ? { ...prev, isNew: false } : null);
    }, 2000);
    
    toast.success(`💰 ¡Nueva oferta de @${donorName}: ${coinsValue} monedas!`);
  };

  const resetAuction = () => {
    setAuctionItem('');
    setBids([]);
    setHighestBid(null);
    setAuctionActive(false);
    setAuctionEnded(false);
    setWinner(null);
    setTimeRemaining(auctionDuration);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      position: 'relative',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      {notification && (
        <TikTokNotification
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Botón de inicio - esquina superior izquierda */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          border: 'none',
          borderRadius: '12px',
          padding: '10px 16px',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '0.85rem',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        🏠 Inicio
      </button>

      {/* Estado de conexión - esquina superior derecha */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: connected 
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))' 
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
        backdropFilter: 'blur(10px)',
        padding: '10px 20px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: 1000
      }}>
        {connected ? `🟢 @${user?.tiktokUsername}` : '🔴 Desconectado'}
      </div>

      {/* Panel de configuración */}
      {showConfig && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,20,0.95))',
          backdropFilter: 'blur(20px)',
          padding: '30px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.1)',
          zIndex: 2000,
          minWidth: '400px'
        }}>
          <h2 style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>⚙️ Configurar Subasta</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              ¿Qué subastarás?
            </label>
            <input
              type="text"
              value={auctionItem}
              onChange={(e) => setAuctionItem(e.target.value)}
              placeholder="Ej: Partida 1vs1, Dedicatoria, Elección de juego..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Duración (segundos)
            </label>
            <input
              type="number"
              value={auctionDuration}
              onChange={(e) => setAuctionDuration(parseInt(e.target.value))}
              min="30"
              max="300"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Oferta mínima (monedas)
            </label>
            <input
              type="number"
              value={minimumBid}
              onChange={(e) => setMinimumBid(parseInt(e.target.value))}
              min="10"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={startAuction}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              🚀 Iniciar Subasta
            </button>
            <button
              onClick={() => setShowConfig(false)}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Overlay flotante estilo TikTok */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '380px',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,20,20,0.85))',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.1)',
        zIndex: 100
      }}>
        {/* Título de la subasta */}
        <div style={{
          textAlign: 'center',
          marginBottom: '15px',
          paddingBottom: '15px',
          borderBottom: '2px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{
            color: 'white',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '5px'
          }}>
            🔨 SUBASTA EN VIVO
          </h2>
          {auctionItem && (
            <p style={{
              color: '#fff',
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              {auctionItem}
            </p>
          )}
        </div>

        {!auctionActive && !auctionEnded ? (
          /* Estado inicial - Sin subasta activa */
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎯</div>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>
              No hay subasta activa
            </p>
            <button
              onClick={() => setShowConfig(true)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              ⚙️ Nueva Subasta
            </button>
          </div>
        ) : auctionEnded ? (
          /* Ganador */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                textAlign: 'center',
                padding: '30px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                borderRadius: '15px',
                marginBottom: '15px'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
              <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.3rem' }}>
                ¡GANADOR!
              </h3>
              {winner && (
                <>
                  <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>
                    @{winner.bidder}
                  </p>
                  <p style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>
                    💰 {winner.amount} monedas
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Subasta activa */
          <>
            {/* Timer */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              padding: '15px',
              background: timeRemaining <= 10 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3))'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))',
              borderRadius: '12px',
              border: '2px solid ' + (timeRemaining <= 10 ? '#ef4444' : '#3b82f6'),
              animation: timeRemaining <= 10 ? 'pulse 1s infinite' : 'none'
            }}>
              <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>
                TIEMPO RESTANTE
              </div>
              <div style={{
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Oferta más alta */}
            {highestBid ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: highestBid.isNew ? [1, 1.05, 1] : 1
                }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3))',
                  padding: '20px',
                  borderRadius: '15px',
                  marginBottom: '15px',
                  border: '2px solid #10b981',
                  boxShadow: highestBid.isNew ? '0 0 30px rgba(16, 185, 129, 0.5)' : 'none'
                }}
              >
                <div style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>
                  👑 OFERTA MÁS ALTA
                </div>
                <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  @{highestBid.bidder}
                </div>
                <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  💰 {highestBid.amount} monedas
                </div>
              </motion.div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: '15px',
                marginBottom: '15px',
                textAlign: 'center',
                border: '2px dashed rgba(255,255,255,0.2)'
              }}>
                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  Esperando la primera oferta...
                </div>
                <div style={{ color: '#fbbf24', fontSize: '1.1rem', marginTop: '5px' }}>
                  💰 Mínimo: {minimumBid} monedas
                </div>
              </div>
            )}

            {/* Historial de ofertas recientes */}
            {bids.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '15px',
                borderRadius: '12px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>
                  📊 OFERTAS RECIENTES
                </div>
                <AnimatePresence>
                  {bids.slice(0, 5).map((bid, index) => (
                    <motion.div
                      key={bid.timestamp}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        marginBottom: '5px',
                        background: index === 0 ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        borderRadius: '8px'
                      }}
                    >
                      <span style={{ color: 'white', fontSize: '0.9rem' }}>
                        @{bid.bidder}
                      </span>
                      <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {bid.amount} 💰
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Botones de control */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={endAuction}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
              >
                🛑 Terminar
              </button>
              <button
                onClick={resetAuction}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🔄 Resetear
              </button>
            </div>
          </>
        )}

        {/* Stats */}
        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '0.85rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#aaa' }}>Ofertas</div>
            <div style={{ color: 'white', fontWeight: 'bold' }}>{stats.totalBids}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#aaa' }}>Participantes</div>
            <div style={{ color: 'white', fontWeight: 'bold' }}>{stats.participants}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#aaa' }}>Total</div>
            <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{stats.totalCoins} 💰</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subasta;
