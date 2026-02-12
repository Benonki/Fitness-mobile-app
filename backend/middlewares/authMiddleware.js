const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Brak tokenu autoryzacyjnego',
      code: 'MISSING_TOKEN'
    });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy format tokenu',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Użytkownik nie istnieje',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    req.token = token;
    next();

  } catch (error) {
    let message = 'Nieprawidłowy token';
    let code = 'INVALID_TOKEN';

    if (error.name === 'TokenExpiredError') {
      message = 'Token wygasł';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Nieprawidłowa sygnatura tokenu';
      code = 'INVALID_SIGNATURE';
    }

    return res.status(401).json({
      success: false,
      message,
      code,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};