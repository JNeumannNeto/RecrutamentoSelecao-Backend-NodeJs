const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('../utils/logger');

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token de acesso é obrigatório'
        });
      }

      const token = authHeader.substring(7);

      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      next();
    } catch (error) {
      logger.error('Erro na autenticação:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      next();
    };
  }

  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso restrito a administradores'
      });
    }

    next();
  }

  requireCandidate(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (req.user.role !== 'candidate') {
      return res.status(403).json({
        success: false,
        message: 'Acesso restrito a candidatos'
      });
    }

    next();
  }
}

module.exports = new AuthMiddleware();
