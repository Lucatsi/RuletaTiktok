import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Chip,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Casino as CasinoIcon,
  FavoriteRounded as HeartIcon,
  GpsFixed as TargetIcon,
  Leaderboard as RankingIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  Notifications as NotificationIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
  tiktokUsername: user?.tiktokUsername || '',
  tiktokEmail: user?.tiktokEmail || '',
    gameSettings: user?.gameSettings || {}
  });
  const [formErrors, setFormErrors] = useState({ username: '', email: '' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const games = [
    {
      title: 'Ruleta de la Suerte',
      description: 'Ruleta que gira automáticamente con cada donación de TikTok Live',
      icon: <CasinoIcon />,
      route: '/games/ruleta',
      color: '#ff6b6b',
      gradient: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
      features: ['Auto-giro', 'Personalizable', 'Efectos visuales']
    },
    {
      title: 'Disparos al Avatar',
      description: 'Cada donación dispara al avatar y reduce su vida',
      icon: <TargetIcon />,
      route: '/games/disparos',
      color: '#4ecdc4',
      gradient: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
      features: ['Animaciones', 'Sistema de vida', 'Efectos sonoros']
    },
    {
      title: 'Barra de Vida',
      description: 'Las donaciones aumentan o reducen la vida según configuración',
      icon: <HeartIcon />,
      route: '/games/vida',
      color: '#45b7d1',
      gradient: 'linear-gradient(135deg, #45b7d1, #667eea)',
      features: ['Tiempo real', 'Configurable', 'Alertas visuales']
    },
    {
      title: 'Subasta',
      description: 'Sistema de subastas en tiempo real con donaciones',
      icon: <RankingIcon />,
      route: '/games/ranking',
      color: '#feca57',
      gradient: 'linear-gradient(135deg, #feca57, #ff9ff3)',
      isNew: true,
      features: ['Timer', 'Pujas en vivo', 'Overlay flotante']
    },
  ];

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const response = await authService.getUserProfile();
      setStats(response.stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));

    // Validación básica inmediata
    if (field === 'tiktokUsername') {
      const hasAt = (value || '').includes('@');
      setFormErrors(prev => ({ ...prev, username: hasAt ? 'No incluyas @ en el usuario' : '' }));
    }
    if (field === 'tiktokEmail') {
      const isValid = !value || /.+@.+\..+/.test(value);
      setFormErrors(prev => ({ ...prev, email: isValid ? '' : 'Correo no válido' }));
    }
  };

  const handleSettingsSave = async () => {
    // Validaciones antes de guardar
    const hasAt = (settings.tiktokUsername || '').includes('@');
    const emailOk = !settings.tiktokEmail || /.+@.+\..+/.test(settings.tiktokEmail);
    if (hasAt || !emailOk) {
      setFormErrors({
        username: hasAt ? 'No incluyas @ en el usuario' : '',
        email: emailOk ? '' : 'Correo no válido'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updateSettings(settings);
      updateUser(response.user);
      toast.success('Configuraciones guardadas');
      setSettingsOpen(false);
    } catch (error) {
      toast.error('Error guardando configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))`,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 8px 32px ${color}40`,
            transform: 'translateY(-2px)',
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
          <Box 
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'white',
              fontSize: '24px',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h3" fontWeight="bold" color={color} sx={{ mb: 1 }}>
            {value}
          </Typography>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const EnhancedGameCard = ({ game, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card 
        sx={{
          height: '100%',
          background: `linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))`,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 12px 40px ${game.color}30`,
            '&::before': {
              opacity: 0.1,
            }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: game.gradient,
            opacity: 0.05,
            transition: 'opacity 0.3s ease',
          }
        }}
      >
        {game.isNew && (
          <Chip
            label="NUEVO"
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
              color: 'white',
              fontWeight: 'bold',
              zIndex: 1,
            }}
          />
        )}
        
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: game.gradient,
                mr: 2,
                boxShadow: `0 4px 20px ${game.color}40`,
              }}
            >
              {game.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                {game.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                {game.description}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Características:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {game.features.map((feature, idx) => (
                <Chip
                  key={idx}
                  label={feature}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: game.color,
                    color: game.color,
                    fontSize: '0.75rem',
                  }}
                />
              ))}
            </Box>
          </Box>
        </CardContent>

    <CardActions sx={{ p: 3, pt: 0, position: 'relative', zIndex: 1 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PlayIcon />}
      onClick={() => navigate(game.route)}
            sx={{
              background: game.gradient,
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                background: game.gradient,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${game.color}40`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            Jugar Ahora
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ 
      flexGrow: 1, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    }}>
      {/* Barra de navegación mejorada */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <DashboardIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            TikTok Games Studio
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              avatar={<Avatar sx={{ bgcolor: '#4caf50' }}>{user?.username?.[0]?.toUpperCase()}</Avatar>}
              label={`¡Hola, ${user?.username}!`}
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 'bold',
              }}
            />
            
            <Tooltip title="Configuraciones">
              <IconButton 
                color="inherit" 
                onClick={handleSettingsOpen}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Button 
              color="inherit" 
              onClick={handleLogout} 
              startIcon={<LogoutIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Alert de configuración mejorado */}
        {!user?.tiktokUsername && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 4,
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: 2,
                '& .MuiAlert-message': { fontWeight: 500 }
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleSettingsOpen}
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                >
                  Configurar Ahora
                </Button>
              }
            >
              <strong>🚀 ¡Configura tu usuario de TikTok!</strong> 
              {' '}Para usar los increíbles juegos necesitas conectar tu cuenta de TikTok.
            </Alert>
          </motion.div>
        )}

        {/* Estadísticas mejoradas */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ mb: 5 }}>
              <Typography 
                variant="h4" 
                gutterBottom 
                fontWeight="bold" 
                sx={{ 
                  mb: 3,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <TrendingUpIcon sx={{ color: '#667eea', fontSize: 40 }} />
                Tus Estadísticas
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    title="Juegos Jugados"
                    value={stats.total_games || 0}
                    icon={<CasinoIcon />}
                    color="#667eea"
                    description="Total de partidas"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <StatCard
                    title="Donaciones"
                    value={stats.total_donations || 0}
                    icon={<HeartIcon />}
                    color="#ff6b6b"
                    description="Donaciones recibidas"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <StatCard
                    title="Promedio"
                    value={Math.round(stats.avg_donations || 0)}
                    icon={<StarIcon />}
                    color="#feca57"
                    description="Donaciones por juego"
                  />
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        )}

        {/* Juegos disponibles */}
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            fontWeight="bold" 
            sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🎮 Juegos Disponibles
          </Typography>

          <Grid container spacing={3}>
            {games.map((game, index) => (
              <Grid item xs={12} sm={6} md={6} lg={6} xl={3} key={game.title}>
                <EnhancedGameCard game={game} index={index} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Instrucciones mejoradas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{ 
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                fontWeight="bold"
                sx={{ 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                📋 Guía Rápida de Uso
              </Typography>
              
              <Grid container spacing={3}>
                {[
                  { 
                    step: "1", 
                    title: "Configura TikTok", 
                    desc: "Ingresa tu usuario de TikTok en configuraciones",
                    icon: <SettingsIcon />
                  },
                  { 
                    step: "2", 
                    title: "Selecciona Juego", 
                    desc: "Elige tu juego favorito y ábrelo",
                    icon: <PlayIcon />
                  },
                  { 
                    step: "3", 
                    title: "Configura OBS", 
                    desc: "Captura ventana + Chroma Key verde",
                    icon: <CasinoIcon />
                  },
                ].map((item, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: 'primary.main',
                          margin: '0 auto 16px',
                          fontSize: '24px',
                        }}
                      >
                        {item.icon}
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Container>

      {/* Dialog de Configuraciones mejorado */}
      <Dialog 
        open={settingsOpen} 
        onClose={handleSettingsClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.95), rgba(42, 42, 42, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.5rem',
        }}>
          ⚙️ Configurar Perfil
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.8 }}>Cuenta de TikTok</Typography>
              <TextField
                fullWidth
                label="Usuario de TikTok (sin @)"
                value={settings.tiktokUsername}
                onChange={(e) => handleSettingsChange('tiktokUsername', e.target.value.trim())}
                error={!!formErrors.username}
                helperText={formErrors.username || 'Ej: Sombrer0verde'}
                placeholder="tu_usuario"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: '#667eea' },
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Correo vinculado a TikTok (opcional)"
                type="email"
                value={settings.tiktokEmail}
                onChange={(e) => handleSettingsChange('tiktokEmail', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email || 'Se usa solo como referencia'}
                placeholder="tu_correo@dominio.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: '#667eea' },
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={settings.tiktokUsername ? `@${settings.tiktokUsername}` : 'Usuario no configurado'}
                color={settings.tiktokUsername ? 'primary' : 'default'}
                variant={settings.tiktokUsername ? 'filled' : 'outlined'}
              />
              {settings.tiktokEmail && (
                <Chip label={settings.tiktokEmail} variant="outlined" />
              )}
            </Box>

            <Paper variant="outlined" sx={{ p: 2, background: 'rgba(255,255,255,0.03)' }}>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                La conexión al LIVE se realiza automáticamente al abrir el juego Ruleta usando tu usuario de TikTok.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip size="small" label="Paso 1: Guarda tu usuario" />
                <Chip size="small" label="Paso 2: Abre Ruleta" />
                <Chip size="small" label="Paso 3: Inicia tu LIVE" />
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleSettingsClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSettingsSave} 
            variant="contained"
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button 
            onClick={() => navigate('/games/ruleta')}
            variant="contained"
            color="success"
            sx={{ borderRadius: 2, fontWeight: 'bold' }}
          >
            Ir a Ruleta y Conectar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;