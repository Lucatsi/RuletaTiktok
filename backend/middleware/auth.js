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
