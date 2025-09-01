import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Avatar,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import gamesService from '../../services/gamesService';
import TikTokNotification from '../../components/TikTokNotification';
import toast from 'react-hot-toast';

const RankingDonadores = () => {
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [topDonors, setTopDonors] = useState([]);
  const [recentDonation, setRecentDonation] = useState(null);
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalGifts: 0,
    totalCoins: 0,
    topDonor: null
  });

  useEffect(() => {
    initializeGame();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, []);

  const initializeGame = async () => {
    try {
      const response = await gamesService.startGame('ranking', {
        maxDonors: 10
      });
      setGameSession(response.gameSession);
      
      socketService.connect();
      socketService.joinGame('ranking', user.id, user.tiktokUsername);
      
      toast.success('¡Ranking de donadores iniciado!');
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
      
      updateRanking(giftData);
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

  const updateRanking = (giftData) => {
    const { donorName, giftCount, coinsValue, giftName } = giftData;
    
    setRecentDonation({
      donor: donorName,
      gift: `${giftCount}x ${giftName}`,
      coins: coinsValue,
      timestamp: Date.now()
    });

    // Actualizar el ranking
    setTopDonors(prevDonors => {
      const existingDonor = prevDonors.find(d => d.name === donorName);
      
      let updatedDonors;
      
      if (existingDonor) {
        // Actualizar donador existente
        updatedDonors = prevDonors.map(donor => 
          donor.name === donorName
            ? {
                ...donor,
                totalCoins: donor.totalCoins + coinsValue,
                totalGifts: donor.totalGifts + giftCount,
                lastGift: giftName,
                isNew: false
              }
            : donor
        );
      } else {
        // Agregar nuevo donador
        const newDonor = {
          name: donorName,
          totalCoins: coinsValue,
          totalGifts: giftCount,
          lastGift: giftName,
          joinedAt: Date.now(),
          isNew: true
        };
        
        updatedDonors = [...prevDonors, newDonor];
        
        // Marcar como no nuevo después de un tiempo
        setTimeout(() => {
          setTopDonors(donors => 
            donors.map(d => d.name === donorName ? { ...d, isNew: false } : d)
          );
        }, 3000);
      }
      
      // Ordenar por monedas y tomar solo los primeros 10
      return updatedDonors
        .sort((a, b) => b.totalCoins - a.totalCoins)
        .slice(0, 10);
    });

    // Actualizar estadísticas generales
    setStats(prev => ({
      ...prev,
      totalGifts: prev.totalGifts + giftCount,
      totalCoins: prev.totalCoins + coinsValue,
      totalDonors: new Set([...topDonors.map(d => d.name), donorName]).size
    }));

    // Remover donación reciente después de un tiempo
    setTimeout(() => {
      setRecentDonation(null);
    }, 5000);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '👑';
      case 1: return '🥈';
      case 2: return '🥉';
      case 3: return '🏅';
      case 4: return '⭐';
      default: return '🎖️';
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return '#ffd700';
      case 1: return '#c0c0c0';
      case 2: return '#cd7f32';
      default: return '#4caf50';
    }
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
          justifyContent: 'flex-start',
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
            mt: 8,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontWeight: 'bold'
          }}
        >
          🏆 TOP DONADORES
        </Typography>

        {/* Estadísticas generales */}
        <Paper
          sx={{
            p: 2,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            display: 'flex',
            gap: 4,
            borderRadius: 2,
            mb: 4,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <Box textAlign="center">
            <Typography variant="h6">{stats.totalDonors}</Typography>
            <Typography variant="caption">Donadores</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">{stats.totalGifts}</Typography>
            <Typography variant="caption">Regalos</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: '#ffd700' }}>{stats.totalCoins}</Typography>
            <Typography variant="caption">Monedas Total</Typography>
          </Box>
        </Paper>

        {/* Donación reciente */}
        <AnimatePresence>
          {recentDonation && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: -50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ marginBottom: 20 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  color: 'white',
                  textAlign: 'center',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                  border: '2px solid white'
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  🎁 ¡NUEVA DONACIÓN!
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  @{recentDonation.donor}
                </Typography>
                <Typography variant="h6">
                  {recentDonation.gift}
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffd700' }}>
                  💰 {recentDonation.coins} monedas
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de top donadores */}
        <Paper
          sx={{
            width: '100%',
            maxWidth: 600,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            border: '2px solid #333'
          }}
        >
          <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid #333' }}>
            <Typography variant="h5" fontWeight="bold">
              🏅 RANKING EN VIVO
            </Typography>
          </Box>

          {topDonors.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ opacity: 0.7 }}>
                🎁 Esperando las primeras donaciones...
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              <AnimatePresence>
                {topDonors.map((donor, index) => (
                  <motion.div
                    key={donor.name}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      backgroundColor: donor.isNew ? 'rgba(102, 126, 234, 0.3)' : 'transparent'
                    }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ 
                      duration: 0.5,
                      backgroundColor: { duration: 3 }
                    }}
                    layout
                  >
                    <ListItem
                      sx={{
                        py: 2,
                        borderBottom: index < topDonors.length - 1 ? '1px solid #333' : 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.05)'
                        }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: getRankColor(index),
                          fontSize: '1.5rem',
                          width: 50,
                          height: 50
                        }}
                      >
                        {getRankIcon(index)}
                      </Avatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                              #{index + 1} @{donor.name}
                            </Typography>
                            {donor.isNew && (
                              <Chip 
                                label="NUEVO" 
                                size="small"
                                sx={{ 
                                  bgcolor: '#4caf50',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: '20px'
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#ffd700' }}>
                              💰 {donor.totalCoins} monedas - 🎁 {donor.totalGifts} regalos
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#aaa' }}>
                              Último regalo: {donor.lastGift}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Paper>

        {/* Instrucciones */}
        <Typography
          variant="body1"
          sx={{
            color: 'white',
            textAlign: 'center',
            mt: 4,
            opacity: 0.8,
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            maxWidth: 600
          }}
        >
          💡 El ranking se actualiza automáticamente con cada regalo recibido en TikTok Live.
          Los donadores aparecen ordenados por el total de monedas donadas.
        </Typography>
      </Box>
    </div>
  );
};

export default RankingDonadores;
