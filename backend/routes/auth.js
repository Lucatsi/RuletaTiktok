const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validaciones básicas
    if (!email || !password || !username) {
      return res.status(400).json({ 
        message: 'Email, contraseña y nombre de usuario son requeridos' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        message: 'El email ya está registrado' 
      });
    }

  // Crear usuario
  const user = await User.create({ email, password, username });

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Error en registro:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' ? { details: error?.message } : {})
    });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tiktokUsername: user.tiktok_username
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar token
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tiktokUsername: user.tiktok_username
      }
    });

  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      message: 'Token inválido o expirado' 
    });
  }
});

module.exports = router;
