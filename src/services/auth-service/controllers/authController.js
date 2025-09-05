const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../../../models/User');
const config = require('../../../config/config');
const logger = require('../../../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, role = 'candidate' } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email já está em uso'
        });
      }

      const user = await User.create({
        id: uuidv4(),
        name,
        email,
        password,
        role
      });

      const userResponse = user.toJSON();
      delete userResponse.password;

      logger.info(`Novo usuário registrado: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: { user: userResponse }
      });
    } catch (error) {
      logger.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      await user.update({ refreshToken });

      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.refreshToken;

      logger.info(`Login realizado: ${email}`);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token é obrigatório'
        });
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await User.findOne({ 
        where: { 
          id: decoded.userId,
          refreshToken 
        } 
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido'
        });
      }

      const newAccessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      await user.update({ refreshToken: newRefreshToken });

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      logger.error('Erro ao renovar token:', error);
      res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }
  }

  async logout(req, res) {
    try {
      const user = await User.findByPk(req.user.userId);
      if (user) {
        await user.update({ refreshToken: null });
      }

      logger.info(`Logout realizado: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Erro ao buscar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, phone, address, dateOfBirth } = req.body;
      
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      await user.update({
        name: name || user.name,
        phone: phone || user.phone,
        address: address || user.address,
        dateOfBirth: dateOfBirth || user.dateOfBirth
      });

      const updatedUser = await User.findByPk(req.user.userId, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      logger.info(`Perfil atualizado: ${user.email}`);

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      await user.update({ password: newPassword });

      logger.info(`Senha alterada: ${user.email}`);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.json({
          success: true,
          message: 'Se o email existir, um link de recuperação será enviado'
        });
      }

      const resetToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      logger.info(`Token de recuperação gerado para: ${email}`);

      res.json({
        success: true,
        message: 'Se o email existir, um link de recuperação será enviado',
        data: { resetToken }
      });
    } catch (error) {
      logger.error('Erro ao solicitar recuperação de senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido'
        });
      }

      await user.update({ password: newPassword });

      logger.info(`Senha redefinida: ${user.email}`);

      res.json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao redefinir senha:', error);
      res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
  }
}

module.exports = new AuthController();
