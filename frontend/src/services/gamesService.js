import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const gamesService = {
  async startGame(gameType, settings = {}) {
    const response = await axios.post(`${API_URL}/games/start`, {
      gameType,
      settings,
    });
    return response.data;
  },

  async getActiveSession(gameType) {
    const response = await axios.get(`${API_URL}/games/active/${gameType}`);
    return response.data;
  },

  async endGame(gameId, stats = {}) {
    const response = await axios.post(`${API_URL}/games/end/${gameId}`, {
      stats,
    });
    return response.data;
  },

  async getGameHistory(limit = 10) {
    const response = await axios.get(`${API_URL}/games/history?limit=${limit}`);
    return response.data;
  },

  async getTopDonors(gameId, limit = 10) {
    const response = await axios.get(`${API_URL}/games/${gameId}/top-donors?limit=${limit}`);
    return response.data;
  },
};

export default gamesService;
