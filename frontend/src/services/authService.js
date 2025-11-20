import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Configurar interceptores para incluir token automáticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  async login(email, password) {
    console.log('🔐 Intentando login a:', `${API_URL}/auth/login`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  async register(userData) {
    console.log('📝 Intentando registro a:', `${API_URL}/auth/register`);
    console.log('📦 Datos a enviar:', userData);
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    console.log('✅ Respuesta del servidor:', response.data);
    return response.data;
  },

  async verifyToken(token) {
    const response = await axios.post(`${API_URL}/auth/verify-token`, {
      token,
    });
    return response.data;
  },

  async getUserProfile() {
    const response = await axios.get(`${API_URL}/users/profile`);
    return response.data;
  },

  async updateSettings(settings) {
    const response = await axios.put(`${API_URL}/users/settings`, settings);
    return response.data;
  },
};

export default authService;
