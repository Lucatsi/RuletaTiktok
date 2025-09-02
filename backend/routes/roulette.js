const express = require('express');
const router = express.Router();
const rouletteService = require('../services/rouletteService');
const auth = require('../middleware/auth');

// Obtener todas las configuraciones de ruleta del usuario
router.get('/configurations', auth, async (req, res) => {
  try {
    const configurations = await rouletteService.getRouletteConfigurations(req.user.id);
    res.json({
      success: true,
      data: configurations
    });
  } catch (error) {
    console.error('Error al obtener configuraciones de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuraciones de ruleta'
    });
  }
});

// Obtener una configuración específica
router.get('/configurations/:id', auth, async (req, res) => {
  try {
    const configuration = await rouletteService.getRouletteConfiguration(req.params.id);
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error al obtener configuración de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de ruleta'
    });
  }
});

// Crear nueva configuración de ruleta
router.post('/configurations', auth, async (req, res) => {
  try {
    const { name, description, options } = req.body;

    if (!name || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. Se requiere nombre y al menos 2 opciones.'
      });
    }

    const configuration = await rouletteService.createRouletteConfiguration(
      req.user.id,
      name,
      description,
      options
    );

    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Configuración de ruleta creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear configuración de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear configuración de ruleta'
    });
  }
});

// Actualizar configuración de ruleta
router.put('/configurations/:id', auth, async (req, res) => {
  try {
    const { name, description, options } = req.body;
    const configId = req.params.id;

    if (!name || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. Se requiere nombre y al menos 2 opciones.'
      });
    }

    const configuration = await rouletteService.updateRouletteConfiguration(
      configId,
      req.user.id,
      name,
      description,
      options
    );

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada o no tienes permisos para editarla'
      });
    }

    res.json({
      success: true,
      data: configuration,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de ruleta'
    });
  }
});

// Eliminar configuración de ruleta
router.delete('/configurations/:id', auth, async (req, res) => {
  try {
    const result = await rouletteService.deleteRouletteConfiguration(req.params.id, req.user.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada o no se puede eliminar'
      });
    }

    res.json({
      success: true,
      message: 'Configuración eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar configuración de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar configuración de ruleta'
    });
  }
});

// Registrar un giro
router.post('/spin', auth, async (req, res) => {
  try {
    const {
      rouletteConfigId,
      sessionId,
      winnerOption,
      spinNumber,
      rotationDegrees,
      durationSeconds,
      triggeredByDonation = false,
      donationId = null,
      viewerCount = 0
    } = req.body;

    if (!rouletteConfigId || !sessionId || !winnerOption || !spinNumber || !rotationDegrees || !durationSeconds) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos para registrar el giro'
      });
    }

    const result = await rouletteService.recordSpin(
      rouletteConfigId,
      sessionId,
      winnerOption,
      spinNumber,
      rotationDegrees,
      durationSeconds,
      triggeredByDonation,
      donationId,
      viewerCount
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Giro registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar giro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar giro'
    });
  }
});

// Obtener historial de giros
router.get('/history/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const history = await rouletteService.getSpinHistory(
      sessionId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
});

// Eliminar historial de una ruleta específica
router.delete('/history/:configId', auth, async (req, res) => {
  try {
    const result = await rouletteService.deleteRouletteHistory(req.params.configId, req.user.id);
    
    res.json({
      success: true,
      data: result,
      message: `Historial eliminado: ${result.deleted} registros`
    });
  } catch (error) {
    console.error('Error al eliminar historial:', error);
    if (error.message.includes('permisos')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar historial'
    });
  }
});

// Obtener estadísticas de sesión
router.get('/stats/:sessionId', auth, async (req, res) => {
  try {
    const stats = await rouletteService.getSessionStats(req.params.sessionId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// Resetear estadísticas de una ruleta
router.post('/reset/:sessionId/:configId', auth, async (req, res) => {
  try {
    const { sessionId, configId } = req.params;
    
    const result = await rouletteService.resetRouletteStats(sessionId, configId, req.user.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Estadísticas reseteadas exitosamente'
    });
  } catch (error) {
    console.error('Error al resetear estadísticas:', error);
    if (error.message.includes('permisos')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al resetear estadísticas'
    });
  }
});

// Obtener configuración por defecto
router.get('/default-configuration', auth, async (req, res) => {
  try {
    const configuration = await rouletteService.getDefaultConfiguration(req.user.id);
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró configuración por defecto'
      });
    }

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error al obtener configuración por defecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración por defecto'
    });
  }
});

module.exports = router;
