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
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'moveGrid 20s linear infinite',
        },
        '@keyframes moveGrid': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' },
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
              background: '#ffffff',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: 'none',
              maxWidth: '500px',
              width: '100%',
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
                      color: '#7e22ce',
                      filter: 'drop-shadow(0 4px 12px rgba(126, 34, 206, 0.4))'
                    }} 
                  />
                </motion.div>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="800"
                  sx={{
                    background: 'linear-gradient(135deg, #1e3c72 0%, #7e22ce 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mt: 2,
                    mb: 1
                  }}
                >
                  ¡Únete Ahora!
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="500" sx={{ mt: 1, mb: 2 }}>
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
                      backgroundColor: '#f8f9fa',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                        borderWidth: 2,
                      },
                      '&:hover': {
                        backgroundColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#7e22ce',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7e22ce',
                        borderWidth: 2,
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#333',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#7e22ce',
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#666',
                      fontWeight: 500,
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
                      backgroundColor: '#f8f9fa',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                        borderWidth: 2,
                      },
                      '&:hover': {
                        backgroundColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#7e22ce',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7e22ce',
                        borderWidth: 2,
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#333',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#7e22ce',
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
                      backgroundColor: '#f8f9fa',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                        borderWidth: 2,
                      },
                      '&:hover': {
                        backgroundColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#7e22ce',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7e22ce',
                        borderWidth: 2,
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#333',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#7e22ce',
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#666',
                      fontWeight: 500,
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
                      backgroundColor: '#f8f9fa',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                        borderWidth: 2,
                      },
                      '&:hover': {
                        backgroundColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#7e22ce',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7e22ce',
                        borderWidth: 2,
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#333',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#7e22ce',
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
                    background: 'linear-gradient(135deg, #1e3c72 0%, #7e22ce 100%)',
                    boxShadow: '0 4px 15px rgba(126, 34, 206, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7e22ce 0%, #1e3c72 100%)',
                      boxShadow: '0 6px 20px rgba(126, 34, 206, 0.6)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&:disabled': {
                      background: '#cccccc',
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
                        color: '#7e22ce',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        '&:hover': {
                          color: '#1e3c72',
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
