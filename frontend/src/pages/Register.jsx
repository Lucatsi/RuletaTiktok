import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  LinearProgress
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Lock as LockIcon, 
  Visibility, 
  VisibilityOff,
  Person as PersonIcon,
  Gamepad as GamepadIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    const result = await register({
      email: formData.email,
      password: formData.password,
      username: formData.username
    });
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        }
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Paper 
            elevation={24} 
            sx={{ 
              p: 5, 
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            }}
          >
            <motion.div variants={itemVariants}>
              <Box textAlign="center" mb={4}>
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <GamepadIcon 
                    sx={{ 
                      fontSize: 80,
                      color: '#764ba2',
                      filter: 'drop-shadow(0 4px 8px rgba(118, 75, 162, 0.3))'
                    }} 
                  />
                </motion.div>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="800"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mt: 2
                  }}
                >
                  ¡Únete Ahora!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Crea tu cuenta y comienza a interactuar con tu audiencia
                </Typography>
              </Box>
            </motion.div>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                REGISTRO
              </Typography>
            </Divider>

            <motion.div variants={itemVariants}>
              {error && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: 28
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
            </motion.div>

            <Box component="form" onSubmit={handleSubmit}>
              <motion.div variants={itemVariants}>
                <TextField
                  fullWidth
                  label="Nombre de Usuario"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Mínimo 3 caracteres"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      }
                    }
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      }
                    }
                  }}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Mínimo 6 caracteres"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      }
                    }
                  }}
                />
                {formData.password && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        Seguridad:
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: passwordStrength < 50 ? '#f44336' : passwordStrength < 75 ? '#ff9800' : '#4caf50'
                        }}
                      >
                        {passwordStrength < 50 ? 'Débil' : passwordStrength < 75 ? 'Media' : 'Fuerte'}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={passwordStrength} 
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          backgroundColor: passwordStrength < 50 ? '#f44336' : passwordStrength < 75 ? '#ff9800' : '#4caf50'
                        }
                      }}
                    />
                  </Box>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {passwordsMatch && (
                          <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
                        )}
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      }
                    }
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    mt: 4, 
                    mb: 2,
                    height: 56,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    boxShadow: '0 4px 20px 0 rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                      boxShadow: '0 6px 25px 0 rgba(102, 126, 234, 0.6)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={28} sx={{ color: 'white' }} />
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Divider sx={{ my: 3 }} />
                <Box textAlign="center">
                  <Typography variant="body1" color="text.secondary">
                    ¿Ya tienes cuenta?{' '}
                    <Link 
                      component={RouterLink} 
                      to="/login" 
                      underline="none"
                      sx={{
                        color: '#667eea',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        '&:hover': {
                          color: '#764ba2',
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Inicia sesión aquí
                    </Link>
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register;
