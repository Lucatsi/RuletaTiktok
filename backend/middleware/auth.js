const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: 'Token de acceso requerido' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Asignar el objeto user completo para las rutas
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    
    // Mantener compatibilidad con código existente
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();

  } catch (error) {
    res.status(401).json({ 
      message: 'Token inválido o expirado' 
    });
  }
};

module.exports = authMiddleware;
