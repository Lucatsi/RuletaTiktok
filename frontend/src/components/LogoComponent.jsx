import React from 'react';
import { Box, Typography } from '@mui/material';
import ASSETS from '../config/assets';

const LogoComponent = ({ variant = 'main', size = 'medium', ...props }) => {
  const getLogoSize = () => {
    switch (size) {
      case 'small': return { width: 40, height: 40 };
      case 'medium': return { width: 80, height: 80 };
      case 'large': return { width: 120, height: 120 };
      case 'xl': return { width: 200, height: 200 };
      default: return { width: 80, height: 80 };
    }
  };

  const logoSrc = ASSETS.logos[variant] || ASSETS.logos.main;

  return (
    <Box 
      component="img"
      src={logoSrc}
      alt="Ruleta TikTok Logo"
      sx={{
        ...getLogoSize(),
        objectFit: 'contain',
        ...props.sx
      }}
      onError={(e) => {
        // Si el logo no se encuentra, mostrar emoji como fallback
        e.target.style.display = 'none';
        if (e.target.nextSibling) {
          e.target.nextSibling.style.display = 'block';
        }
      }}
      {...props}
    />
  );
};

// Componente de fallback si no hay logo
const LogoFallback = ({ size = 'medium' }) => {
  const getFontSize = () => {
    switch (size) {
      case 'small': return '2rem';
      case 'medium': return '4rem';
      case 'large': return '6rem';
      case 'xl': return '10rem';
      default: return '4rem';
    }
  };

  return (
    <Typography 
      sx={{ 
        fontSize: getFontSize(),
        display: 'none' // Se mostrará solo si falla la imagen
      }}
    >
      🎮
    </Typography>
  );
};

export default LogoComponent;
