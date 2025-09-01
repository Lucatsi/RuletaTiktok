import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Paper, LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import gamesService from '../../services/gamesService';
import TikTokNotification from '../../components/TikTokNotification';
import toast from 'react-hot-toast';

const BarraVida = () => {
  const { user } = useAuth();
  const [vida, setVida] = useState(50); // Empezar en 50%
  const [maxVida, setMaxVida] = useState(100);
  const [gameSession, setGameSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [lastChange, setLastChange] = useState(null);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [stats, setStats] = useState({
    totalGifts: 0,
    totalHealing: 0,
    totalDamage: 0,
    maxVidaReached: 50
  });

  // Configuración de regalos (puedes personalizar)
  const giftEffects = {
    // Regalos que curan (nombres comunes en TikTok)
    'Rose': { effect: 'heal', value: 5, color: '#e91e63' },
    'Heart': { effect: 'heal', value: 10, color: '#f44336' },
    'Love': { effect: 'heal', value: 15, color: '#9c27b0' },
    'Crown': { effect: 'heal', value: 25, color: '#ff9800' },
    'Lion': { effect: 'heal', value: 50, color: '#ffc107' },
    
    // Regalos que dañan
    'Bomb': { effect: 'damage', value: 20, color: '#795548' },
    'Thunder': { effect: 'damage', value: 15, color: '#607d8b' },
    'Fire': { effect: 'damage', value: 10, color: '#ff5722' },
    
    // Por defecto - la mayoría de regalos curan
    'default': { effect: 'heal', value: 8, color: '#4caf50' }
  };

  useEffect(() => {
    initializeGame();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, []);

  const initializeGame = async () => {
    try {
      const response = await gamesService.startGame('vida', {
        startingHealth: 50,
        maxHealth: 100,
        giftEffects: giftEffects
      });
      setGameSession(response.gameSession);
      
      socketService.connect();
      socketService.joinGame('vida', user.id, user.tiktokUsername);
      
      toast.success('¡Juego de barra de vida iniciado!');
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
      
      processGift(giftData);
    });

    // También reaccionar a follows (opcional)
    socketService.onTikTokFollow((data) => {
      setNotification(data);
      setTimeout(() => setNotification(null), 2000);
      
      // Los follows siempre curan un poco
      processHealthChange('heal', 5, 'Nuevo seguidor', '#4caf50');
    });
  };

  const cleanup = () => {
    socketService.removeAllEventListeners('tiktok-connected');
    socketService.removeAllEventListeners('tiktok-disconnected');
    socketService.removeAllEventListeners('tiktok-error');
    socketService.removeAllEventListeners('tiktok-gift');
    socketService.removeAllEventListeners('tiktok-follow');
    
    if (gameSession) {
      gamesService.endGame(gameSession.id, stats);
    }
  };

  const processGift = (giftData) => {
    const giftName = giftData.giftName;
    const giftCount = giftData.giftCount;
    
    // Buscar configuración del regalo
    const giftConfig = giftEffects[giftName] || giftEffects['default'];
    
    const totalValue = giftConfig.value * giftCount;
    const effect = giftConfig.effect;
    const color = giftConfig.color;
    
    processHealthChange(effect, totalValue, `${giftCount}x ${giftName}`, color);
    
    // Actualizar estadísticas
    setStats(prev => ({
      ...prev,
      totalGifts: prev.totalGifts + giftCount,
      totalHealing: prev.totalHealing + (effect === 'heal' ? totalValue : 0),
      totalDamage: prev.totalDamage + (effect === 'damage' ? totalValue : 0)
    }));
  };

  const processHealthChange = (effect, value, source, color) => {
    let newVida;
    
    if (effect === 'heal') {
      newVida = Math.min(maxVida, vida + value);
      setLastChange({
        type: 'heal',
        value: `+${value}`,
        source,
        color
      });
    } else {
      newVida = Math.max(0, vida - value);
      setLastChange({
        type: 'damage',
        value: `-${value}`,
        source,
        color
      });
    }
    
    setVida(newVida);
    setPulseEffect(true);
    
    // Actualizar máximo alcanzado
    setStats(prev => ({
      ...prev,
      maxVidaReached: Math.max(prev.maxVidaReached, newVida)
    }));
    
    // Efectos visuales y sonoros
    if (newVida >= 100) {
      toast.success('🎉 ¡VIDA MÁXIMA ALCANZADA!');
    } else if (newVida <= 0) {
      toast.error('💀 ¡SIN VIDA!');
    } else if (effect === 'heal') {
      toast.success(`💚 +${value} vida de ${source}`);
    } else {
      toast.error(`💔 -${value} vida de ${source}`);
    }
    
    // Remover efectos después de un tiempo
    setTimeout(() => {
      setPulseEffect(false);
      setLastChange(null);
    }, 2000);
  };

  const getVidaColor = () => {
    if (vida >= 80) return '#4caf50';
    if (vida >= 50) return '#8bc34a';
    if (vida >= 30) return '#ff9800';
    if (vida > 0) return '#f44336';
    return '#9e9e9e';
  };

  const getVidaStatus = () => {
    if (vida >= 100) return '🌟 MÁXIMA';
    if (vida >= 80) return '💚 EXCELENTE';
    if (vida >= 60) return '😊 BUENA';
    if (vida >= 40) return '😐 REGULAR';
    if (vida >= 20) return '😟 BAJA';
    if (vida > 0) return '🆘 CRÍTICA';
    return '💀 SIN VIDA';
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
            mb: 4,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontWeight: 'bold'
          }}
        >
          💖 BARRA DE VIDA
        </Typography>

        {/* Barra de vida principal */}
        <Box sx={{ width: '80%', maxWidth: 800, mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              {getVidaStatus()}
            </Typography>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              {Math.round(vida)}/{maxVida}
            </Typography>
          </Box>
          
          <motion.div
            animate={{
              scale: pulseEffect ? [1, 1.02, 1] : 1,
              boxShadow: pulseEffect 
                ? [`0 0 20px ${getVidaColor()}`, `0 0 40px ${getVidaColor()}`, `0 0 20px ${getVidaColor()}`]
                : `0 0 20px ${getVidaColor()}`
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <LinearProgress
              variant="determinate"
              value={(vida / maxVida) * 100}
              sx={{
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '4px solid white',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getVidaColor(),
                  borderRadius: 30,
                  transition: 'all 0.8s ease',
                  background: `linear-gradient(90deg, ${getVidaColor()}, ${getVidaColor()}AA)`
                }
              }}
            />
          </motion.div>

          {/* Porcentaje centrado */}
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              textAlign: 'center',
              mt: 2,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {Math.round((vida / maxVida) * 100)}%
          </Typography>
        </Box>

        {/* Último cambio */}
        <AnimatePresence>
          {lastChange && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: lastChange.color,
                  color: 'white',
                  textAlign: 'center',
                  borderRadius: 3,
                  mb: 4,
                  boxShadow: `0 8px 32px ${lastChange.color}66`,
                  border: '2px solid white'
                }}
              >
                <Typography variant="h3" fontWeight="bold">
                  {lastChange.value}
                </Typography>
                <Typography variant="h6">
                  {lastChange.source}
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estadísticas */}
        <Paper
          sx={{
            p: 3,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            display: 'flex',
            gap: 4,
            borderRadius: 2,
            mb: 2,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <Box textAlign="center">
            <Typography variant="h6">{stats.totalGifts}</Typography>
            <Typography variant="caption">Regalos</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: '#4caf50' }}>{stats.totalHealing}</Typography>
            <Typography variant="caption">Curación</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: '#f44336' }}>{stats.totalDamage}</Typography>
            <Typography variant="caption">Daño</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: '#ffc107' }}>{Math.round(stats.maxVidaReached)}</Typography>
            <Typography variant="caption">Vida Máxima</Typography>
          </Box>
        </Paper>

        {/* Configuración de regalos */}
        <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <Paper sx={{ p: 2, background: 'rgba(0,0,0,0.8)', color: 'white' }}>
            <Typography variant="h6" gutterBottom>🎁 Efectos de regalos:</Typography>
            <Typography variant="body2">
              💚 Rose (+5), Heart (+10), Love (+15), Crown (+25), Lion (+50)
            </Typography>
            <Typography variant="body2">
              💔 Bomb (-20), Thunder (-15), Fire (-10)
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              👥 Los follows también dan +5 de vida
            </Typography>
          </Paper>
        </Box>
      </Box>
    </div>
  );
};

export default BarraVida;
