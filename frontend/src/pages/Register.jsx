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
  CircularProgress
} from '@mui/material';
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

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h3" component="h1" gutterBottom>
                🎮
              </Typography>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Únete a Ruleta TikTok
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Crea tu cuenta y comienza a interactuar con tu audiencia
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Nombre de usuario"
                name="username"
                value={formData.username}
                onChange={handleChange}
                margin="normal"
                required
                disabled={loading}
                helperText="Mínimo 3 caracteres"
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                disabled={loading}
              />
              
              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                disabled={loading}
                helperText="Mínimo 6 caracteres"
              />

              <TextField
                fullWidth
                label="Confirmar contraseña"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  height: 50,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Crear Cuenta'}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2">
                  ¿Ya tienes cuenta?{' '}
                  <Link component={RouterLink} to="/login" underline="hover">
                    Inicia sesión aquí
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register;
