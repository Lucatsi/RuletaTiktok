import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Box,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ 
  title, 
  description, 
  icon, 
  route, 
  color = '#667eea',
  isNew = false,
  features = [] 
}) => {
  const navigate = useNavigate();

  const handlePlay = () => {
    navigate(route);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          background: 'linear-gradient(145deg, #1e1e1e 0%, #2a2a2a 100%)',
          border: '1px solid #333',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {isNew && (
          <Chip 
            label="NUEVO" 
            size="small"
            sx={{ 
              position: 'absolute',
              top: -8,
              right: 16,
              bgcolor: '#ff4757',
              color: 'white',
              zIndex: 1
            }}
          />
        )}
        
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Box 
              sx={{ 
                fontSize: '2rem',
                marginRight: 2,
                filter: `drop-shadow(0 0 10px ${color})`
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" component="h2" fontWeight="bold">
              {title}
            </Typography>
          </Box>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 2, minHeight: '40px' }}
          >
            {description}
          </Typography>

          {features.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
              {features.map((feature, index) => (
                <Chip 
                  key={index}
                  label={feature}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Button 
            fullWidth
            variant="contained"
            onClick={handlePlay}
            sx={{
              background: `linear-gradient(45deg, ${color} 30%, ${color}CC 90%)`,
              '&:hover': {
                background: `linear-gradient(45deg, ${color}DD 30%, ${color}AA 90%)`,
              }
            }}
          >
            Jugar Ahora
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default GameCard;
