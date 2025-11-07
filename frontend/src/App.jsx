import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import ASSETS from './config/assets';

// Componentes
import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Ruleta from './pages/games/Ruleta';
import RouletteOverlay from './pages/games/RouletteOverlay';
import Disparos from './pages/games/Disparos';
import BarraVida from './pages/games/BarraVida';
import RankingDonadores from './pages/games/RankingDonadores';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Rutas protegidas */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Juegos */}
              <Route 
                path="/games/ruleta" 
                element={
                  <ProtectedRoute>
                    <Ruleta />
                  </ProtectedRoute>
                } 
              />
              {/* Overlay flotante de ruleta (sin fondo, para OBS/captura) */}
              <Route 
                path="/roulette-overlay" 
                element={<RouletteOverlay />} 
              />
              <Route 
                path="/games/disparos" 
                element={
                  <ProtectedRoute>
                    <Disparos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/games/vida" 
                element={
                  <ProtectedRoute>
                    <BarraVida />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/games/ranking" 
                element={
                  <ProtectedRoute>
                    <RankingDonadores />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            
            {/* Notificaciones globales */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
