import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, Paper, LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import gamesService from '../../services/gamesService';
import TikTokNotification from '../../components/TikTokNotification';
import toast from 'react-hot-toast';

const Disparos = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [gameSession, setGameSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isDamaged, setIsDamaged] = useState(false);
  const [stats, setStats] = useState({
    totalShots: 0,
    totalDamage: 0,
    totalGifts: 0
  });
  const [hits, setHits] = useState([]);

  const avatarRef = useRef(null);

  useEffect(() => {
    initializeGame();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, []);

  const initializeGame = async () => {
    try {
      const response = await gamesService.startGame('disparos', {
        maxHealth: 100,
        damagePerGift: 10
      });
      setGameSession(response.gameSession);
      
      socketService.connect();
      socketService.joinGame('disparos', user.id, user.tiktokUsername);
      
      toast.success('¡Juego de disparos iniciado!');
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
      setNotification(giftData);
      setTimeout(() => setNotification(null), 3000);
      
      // Disparar al avatar
      shootAvatar(giftData);
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

  const shootAvatar = (giftData) => {
    const damage = Math.min(giftData.giftCount * 5, 20); // Máximo 20 de daño
    const newHealth = Math.max(0, health - damage);
    
    setHealth(newHealth);
    setIsDamaged(true);
    
    // Crear efecto de impacto visual
    const hitId = Date.now();
    setHits(prev => [...prev, { id: hitId, x: Math.random() * 100, y: Math.random() * 100 }]);
    
    // Remover efecto después de un tiempo
    setTimeout(() => {
      setHits(prev => prev.filter(hit => hit.id !== hitId));
      setIsDamaged(false);
    }, 500);
    
    // Actualizar estadísticas
    setStats(prev => ({
      totalShots: prev.totalShots + giftData.giftCount,
      totalDamage: prev.totalDamage + damage,
      totalGifts: prev.totalGifts + 1
    }));
    
    // Verificar si murió
    if (newHealth <= 0) {
      toast.error('💀 ¡El avatar ha muerto!');
      setTimeout(() => {
        // Revivir después de 3 segundos
        setHealth(maxHealth);
        toast.success('💖 ¡Revivió!');
      }, 3000);
    }
  };

  const getHealthColor = () => {
    if (health > 70) return '#4caf50';
    if (health > 30) return '#ff9800';
    return '#f44336';
  };

  const getHealthStatus = () => {
    if (health <= 0) return '💀 MUERTO';
    if (health <= 20) return '🩸 CRÍTICO';
    if (health <= 50) return '⚠️ HERIDO';
    return '💚 SALUDABLE';
  };

  return (
    <div className="game-background">
      <div className="chroma-key-info">
        Fondo verde para chroma key - TikTok Live Studio
      </div>

      {notification && (
        <TikTokNotification
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          position: 'relative'
        }}
      >
        {/* Estado de conexión */}
        <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
          <Chip
            label={connected ? `🟢 Conectado @${user?.tiktokUsername}` : '🔴 Desconectado'}
            color={connected ? 'success' : 'error'}
            variant="filled"
            sx={{ fontSize: '1.1rem', p: 1 }}
          />
        </Box>

        {/* Título */}
        <Typography
          variant="h2"
          sx={{
            color: 'white',
            textAlign: 'center',
            mb: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontWeight: 'bold'
          }}
        >
          🎯 DISPAROS AL AVATAR
        </Typography>

        {/* Barra de vida */}
        <Box sx={{ width: '60%', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              {getHealthStatus()}
            </Typography>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              {health}/{maxHealth}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(health / maxHealth) * 100}
            sx={{
              height: 20,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getHealthColor(),
                borderRadius: 10,
                transition: 'all 0.5s ease'
              }
            }}
          />
        </Box>

        {/* Avatar */}
        <Box sx={{ position: 'relative', mb: 4 }}>
          <motion.div
            ref={avatarRef}
            animate={{
              scale: isDamaged ? [1, 0.9, 1.1, 1] : 1,
              x: isDamaged ? [0, -10, 10, -5, 5, 0] : 0,
              filter: health <= 0 ? 'grayscale(100%) brightness(0.5)' : 'none'
            }}
            transition={{ duration: 0.5 }}
            style={{
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: health <= 0 
                ? 'linear-gradient(145deg, #666, #333)'
                : 'linear-gradient(145deg, #667eea, #764ba2)',
              border: `8px solid ${isDamaged ? '#f44336' : '#ffffff'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '120px',
              boxShadow: isDamaged 
                ? '0 0 50px rgba(244, 67, 54, 0.8)'
                : '0 0 30px rgba(255,255,255,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {health <= 0 ? '💀' : '🧙‍♂️'}
            
            {/* Efectos de impacto */}
            <AnimatePresence>
              {hits.map(hit => (
                <motion.div
                  key={hit.id}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    left: `${hit.x}%`,
                    top: `${hit.y}%`,
                    fontSize: '30px',
                    pointerEvents: 'none'
                  }}
                >
                  💥
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Indicador de daño */}
          <AnimatePresence>
            {isDamaged && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: -60 }}
                exit={{ opacity: 0, y: -100 }}
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#f44336',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                💥 HIT!
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Estadísticas */}
        <Paper
          sx={{
            p: 3,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            display: 'flex',
            gap: 4,
            borderRadius: 2,
            mb: 2
          }}
        >
          <Box textAlign="center">
            <Typography variant="h6">{stats.totalShots}</Typography>
            <Typography variant="caption">Disparos</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">{stats.totalDamage}</Typography>
            <Typography variant="caption">Daño Total</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">{stats.totalGifts}</Typography>
            <Typography variant="caption">Regalos</Typography>
          </Box>
        </Paper>

        {/* Instrucciones */}
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            textAlign: 'center',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            opacity: 0.8
          }}
        >
          💡 Los regalos de TikTok disparan automáticamente al avatar
        </Typography>
      </Box>
    </div>
  );
};

export default Disparos;
