const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Helper para parsear game_settings de forma segura
const parseGameSettings = (val) => {
  if (val == null) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val; // ya es objeto
};

// Obtener perfil del usuario
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener estadísticas
    const stats = await User.getStats(req.userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tiktokUsername: user.tiktok_username,
        tiktokEmail: user.tiktok_email,
        gameSettings: parseGameSettings(user.game_settings)
      },
      stats
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar configuraciones del usuario
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { tiktokUsername, tiktokEmail, gameSettings } = req.body;

    const updatedUser = await User.updateSettings(req.userId, {
      tiktokUsername,
      tiktokEmail,
      gameSettings
    });

    res.json({
      message: 'Configuraciones actualizadas',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        tiktokUsername: updatedUser.tiktok_username,
        tiktokEmail: updatedUser.tiktok_email,
        gameSettings: parseGameSettings(updatedUser.game_settings)
      }
    });

  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
