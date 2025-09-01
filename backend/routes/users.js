const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Obtener perfil del usuario
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener estadísticas
    const stats = await User.getStats(req.userId);

    // Parseo seguro de game_settings
    const parseGameSettings = (val) => {
      if (val == null) return null;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val; // ya es objeto
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tiktokUsername: user.tiktok_username,
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
    const { tiktokUsername, gameSettings } = req.body;

    const updatedUser = await User.updateSettings(req.userId, {
      tiktokUsername,
      gameSettings
    });

    res.json({
      message: 'Configuraciones actualizadas',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        tiktokUsername: updatedUser.tiktok_username,
        gameSettings: parseGameSettings(updatedUser.game_settings)
      }
    });

  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
