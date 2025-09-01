// Configuración de assets de la aplicación
// Aquí defines todas las rutas de tus imágenes, logos e iconos

// 📁 ESTRUCTURA DE ARCHIVOS:
// 
// frontend/public/          <- Para archivos estáticos (accesibles directamente por URL)
// ├── logos/               <- Tu logo principal, favicon, etc.
// ├── icons/               <- Iconos de juegos, botones, etc.
// └── images/              <- Imágenes grandes, backgrounds, etc.
//
// frontend/src/assets/     <- Para archivos que se procesan con Vite
// ├── images/              <- Imágenes que importas en componentes
// └── icons/               <- Iconos SVG que usas como componentes

export const ASSETS = {
  // Logos principales
  logos: {
    main: '/logos/logo-principal.png',           // Tu logo principal
    white: '/logos/logo-blanco.png',             // Logo en blanco
    dark: '/logos/logo-oscuro.png',              // Logo oscuro
    favicon: '/logos/favicon.ico',               // Favicon del sitio
    small: '/logos/logo-pequeño.png',            // Logo pequeño para header
  },

  // Iconos de juegos
  gameIcons: {
    ruleta: '/icons/ruleta-icon.png',
    disparos: '/icons/disparos-icon.png',
    vida: '/icons/vida-icon.png',
    ranking: '/icons/ranking-icon.png',
  },

  // Imágenes de juegos (backgrounds, avatares, etc.)
  gameImages: {
    ruletaBackground: '/images/ruleta-bg.jpg',
    avatarDefault: '/images/avatar-default.png',
    avatarHurt: '/images/avatar-hurt.png',
    ruletaWheel: '/images/ruleta-wheel.png',
  },

  // Iconos generales de UI
  ui: {
    tiktok: '/icons/tiktok-logo.png',
    settings: '/icons/settings-icon.svg',
    stats: '/icons/stats-icon.svg',
    crown: '/icons/crown-icon.png',
  },

  // Imágenes de fondo y decorativas
  backgrounds: {
    login: '/images/login-background.jpg',
    dashboard: '/images/dashboard-bg.jpg',
    gameChromaKey: '#00FF00', // Color chroma key (no es archivo)
  },

  // Efectos especiales (GIFs, animaciones)
  effects: {
    explosion: '/images/explosion.gif',
    sparkles: '/images/sparkles.gif',
    confetti: '/images/confetti.gif',
  }
};

// Función helper para obtener la URL completa de un asset
export const getAssetUrl = (path) => {
  return new URL(path, import.meta.url).href;
};

// Función para verificar si un asset existe
export const checkAssetExists = async (path) => {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export default ASSETS;
