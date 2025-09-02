const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class RouletteService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Configurar el token de autenticación
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Headers con autenticación
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` })
    };
  }

  // Obtener todas las configuraciones de ruleta
  async getConfigurations() {
    try {
      const response = await fetch(`${API_URL}/api/roulette/configurations`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener configuraciones');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getConfigurations:', error);
      throw error;
    }
  }

  // Obtener una configuración específica
  async getConfiguration(id) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/configurations/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener configuración');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getConfiguration:', error);
      throw error;
    }
  }

  // Crear nueva configuración
  async createConfiguration(name, description, options) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/configurations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, description, options })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear configuración');
      }

      return data.data;
    } catch (error) {
      console.error('Error en createConfiguration:', error);
      throw error;
    }
  }

  // Actualizar configuración
  async updateConfiguration(id, name, description, options) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/configurations/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, description, options })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar configuración');
      }

      return data.data;
    } catch (error) {
      console.error('Error en updateConfiguration:', error);
      throw error;
    }
  }

  // Eliminar configuración
  async deleteConfiguration(id) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/configurations/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar configuración');
      }

      return data;
    } catch (error) {
      console.error('Error en deleteConfiguration:', error);
      throw error;
    }
  }

  // Registrar un giro
  async recordSpin(rouletteConfigId, sessionId, winnerOption, spinNumber, rotationDegrees, durationSeconds, triggeredByDonation = false, donationId = null, viewerCount = 0) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/spin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          rouletteConfigId,
          sessionId,
          winnerOption,
          spinNumber,
          rotationDegrees,
          durationSeconds,
          triggeredByDonation,
          donationId,
          viewerCount
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar giro');
      }

      return data.data;
    } catch (error) {
      console.error('Error en recordSpin:', error);
      throw error;
    }
  }

  // Obtener historial de giros
  async getSpinHistory(sessionId, limit = 50, offset = 0) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/history/${sessionId}?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener historial');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getSpinHistory:', error);
      throw error;
    }
  }

  // Eliminar historial de una ruleta
  async deleteRouletteHistory(configId) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/history/${configId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar historial');
      }

      return data;
    } catch (error) {
      console.error('Error en deleteRouletteHistory:', error);
      throw error;
    }
  }

  // Obtener estadísticas de sesión
  async getSessionStats(sessionId) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/stats/${sessionId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener estadísticas');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getSessionStats:', error);
      throw error;
    }
  }

  // Resetear estadísticas
  async resetRouletteStats(sessionId, configId) {
    try {
      const response = await fetch(`${API_URL}/api/roulette/reset/${sessionId}/${configId}`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al resetear estadísticas');
      }

      return data;
    } catch (error) {
      console.error('Error en resetRouletteStats:', error);
      throw error;
    }
  }

  // Obtener configuración por defecto
  async getDefaultConfiguration() {
    try {
      const response = await fetch(`${API_URL}/api/roulette/default-configuration`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener configuración por defecto');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getDefaultConfiguration:', error);
      throw error;
    }
  }
}

export default new RouletteService();
