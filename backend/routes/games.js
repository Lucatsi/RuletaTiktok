const express = require('express');
const Game = require('../models/Game');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Iniciar nueva sesión de juego
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { gameType, settings } = req.body;

    // Validar tipo de juego
    const validGameTypes = ['ruleta', 'disparos', 'vida', 'ranking'];
    if (!validGameTypes.includes(gameType)) {
      return res.status(400).json({ 
        message: 'Tipo de juego inválido' 
      });
    }

    // Crear sesión de juego
    const gameSession = await Game.createSession(req.userId, gameType, settings);

    res.json({
      message: 'Sesión de juego iniciada',
      gameSession
    });

  } catch (error) {
    console.error('Error iniciando juego:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener sesión activa
router.get('/active/:gameType', authMiddleware, async (req, res) => {
  try {
    const { gameType } = req.params;
    
    const activeSession = await Game.getActiveSession(req.userId, gameType);
    
    res.json({ activeSession });

  } catch (error) {
    console.error('Error obteniendo sesión activa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Finalizar sesión de juego
router.post('/end/:gameId', authMiddleware, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { stats } = req.body;

    const completedGame = await Game.endSession(gameId, stats);

    res.json({
      message: 'Sesión finalizada',
      game: completedGame
    });

  } catch (error) {
    console.error('Error finalizando juego:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener historial de juegos
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const history = await Game.getHistory(req.userId, parseInt(limit));

    res.json({ history });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener top donadores de un juego
router.get('/:gameId/top-donors', authMiddleware, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { limit = 10 } = req.query;

    const topDonors = await Game.getTopDonors(gameId, parseInt(limit));

    res.json({ topDonors });

  } catch (error) {
    console.error('Error obteniendo top donadores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
