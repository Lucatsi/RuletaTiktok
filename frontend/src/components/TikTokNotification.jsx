import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon, CardGiftcard as GiftIcon } from '@mui/icons-material';

const TikTokNotification = ({ notification, onClose }) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'gift':
        return <GiftIcon sx={{ color: '#ff6b6b' }} />;
      case 'follow':
        return '👤';
      case 'chat':
        return '💬';
      case 'like':
        return '❤️';
      case 'share':
        return '📤';
      default:
        return '🎉';
    }
  };

  const getMessage = () => {
    switch (notification.type) {
      case 'gift':
        return `${notification.donorName} envió ${notification.giftCount}x ${notification.giftName}`;
      case 'follow':
        return `${notification.username} te siguió`;
      case 'chat':
        return `${notification.username}: ${notification.message}`;
      case 'like':
        return `${notification.username} envió ${notification.likeCount} likes`;
      case 'share':
        return `${notification.username} compartió tu live`;
      default:
        return 'Evento de TikTok';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30 
        }}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          maxWidth: 350,
        }}
      >
        <Box
          sx={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #333',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Box sx={{ fontSize: '1.5rem' }}>
            {getIcon()}
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white',
                wordBreak: 'break-word',
                lineHeight: 1.3
              }}
            >
              {getMessage()}
            </Typography>
            
            {notification.type === 'gift' && notification.coinsValue > 0 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#ffd700',
                  fontWeight: 'bold',
                  display: 'block',
                  mt: 0.5
                }}
              >
                💰 {notification.coinsValue} monedas
              </Typography>
            )}
          </Box>
          
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: 'white' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default TikTokNotification;
