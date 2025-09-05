const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class ValidationMiddleware {
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }

  get validateRegister() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),
      
      body('email')
        .trim()
        .isEmail()
        .withMessage('Email deve ter um formato válido')
        .normalizeEmail(),
      
      body('password')
        .isLength({ min: 8 })
        .withMessage('Senha deve ter pelo menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
      
      body('role')
        .optional()
        .isIn(['admin', 'candidate'])
        .withMessage('Role deve ser admin ou candidate'),
      
      this.handleValidationErrors
    ];
  }

  get validateLogin() {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Email deve ter um formato válido')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('Senha é obrigatória'),
      
      this.handleValidationErrors
    ];
  }

  get validateRefreshToken() {
    return [
      body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token é obrigatório'),
      
      this.handleValidationErrors
    ];
  }

  get validateProfileUpdate() {
    return [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),
      
      body('phone')
        .optional()
        .trim()
        .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
        .withMessage('Telefone deve ter o formato (XX) XXXXX-XXXX'),
      
      body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Endereço deve ter entre 5 e 200 caracteres'),
      
      body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Data de nascimento deve ter um formato válido (YYYY-MM-DD)')
        .custom((value) => {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          
          if (age < 16 || age > 100) {
            throw new Error('Idade deve estar entre 16 e 100 anos');
          }
          
          return true;
        }),
      
      this.handleValidationErrors
    ];
  }

  get validateChangePassword() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Senha atual é obrigatória'),
      
      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Nova senha deve ter pelo menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial')
        .custom((value, { req }) => {
          if (value === req.body.currentPassword) {
            throw new Error('Nova senha deve ser diferente da senha atual');
          }
          return true;
        }),
      
      this.handleValidationErrors
    ];
  }

  get validateForgotPassword() {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Email deve ter um formato válido')
        .normalizeEmail(),
      
      this.handleValidationErrors
    ];
  }

  get validateResetPassword() {
    return [
      body('token')
        .notEmpty()
        .withMessage('Token é obrigatório'),
      
      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Nova senha deve ter pelo menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
      
      this.handleValidationErrors
    ];
  }

  get validateJobCreate() {
    return [
      body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Título deve ter entre 5 e 100 caracteres'),
      
      body('description')
        .trim()
        .isLength({ min: 20, max: 2000 })
        .withMessage('Descrição deve ter entre 20 e 2000 caracteres'),
      
      body('requirements')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Requisitos devem ter entre 10 e 1000 caracteres'),
      
      body('location')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Localização deve ter entre 2 e 100 caracteres'),
      
      body('employmentType')
        .isIn(['full-time', 'part-time', 'contract', 'internship'])
        .withMessage('Tipo de emprego deve ser: full-time, part-time, contract ou internship'),
      
      body('experienceLevel')
        .isIn(['entry', 'mid', 'senior', 'lead'])
        .withMessage('Nível de experiência deve ser: entry, mid, senior ou lead'),
      
      body('salaryMin')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salário mínimo deve ser um número positivo'),
      
      body('salaryMax')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salário máximo deve ser um número positivo')
        .custom((value, { req }) => {
          if (req.body.salaryMin && value < req.body.salaryMin) {
            throw new Error('Salário máximo deve ser maior que o salário mínimo');
          }
          return true;
        }),
      
      body('skills')
        .optional()
        .isArray()
        .withMessage('Skills deve ser um array')
        .custom((skills) => {
          if (skills.length > 20) {
            throw new Error('Máximo de 20 skills permitidas');
          }
          return true;
        }),
      
      body('skills.*')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Cada skill deve ter entre 2 e 50 caracteres'),
      
      this.handleValidationErrors
    ];
  }

  get validateJobUpdate() {
    return [
      body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Título deve ter entre 5 e 100 caracteres'),
      
      body('description')
        .optional()
        .trim()
        .isLength({ min: 20, max: 2000 })
        .withMessage('Descrição deve ter entre 20 e 2000 caracteres'),
      
      body('requirements')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Requisitos devem ter entre 10 e 1000 caracteres'),
      
      body('location')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Localização deve ter entre 2 e 100 caracteres'),
      
      body('employmentType')
        .optional()
        .isIn(['full-time', 'part-time', 'contract', 'internship'])
        .withMessage('Tipo de emprego deve ser: full-time, part-time, contract ou internship'),
      
      body('experienceLevel')
        .optional()
        .isIn(['entry', 'mid', 'senior', 'lead'])
        .withMessage('Nível de experiência deve ser: entry, mid, senior ou lead'),
      
      body('status')
        .optional()
        .isIn(['draft', 'published', 'closed'])
        .withMessage('Status deve ser: draft, published ou closed'),
      
      body('salaryMin')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salário mínimo deve ser um número positivo'),
      
      body('salaryMax')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salário máximo deve ser um número positivo')
        .custom((value, { req }) => {
          if (req.body.salaryMin && value < req.body.salaryMin) {
            throw new Error('Salário máximo deve ser maior que o salário mínimo');
          }
          return true;
        }),
      
      body('skills')
        .optional()
        .isArray()
        .withMessage('Skills deve ser um array')
        .custom((skills) => {
          if (skills.length > 20) {
            throw new Error('Máximo de 20 skills permitidas');
          }
          return true;
        }),
      
      body('skills.*')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Cada skill deve ter entre 2 e 50 caracteres'),
      
      this.handleValidationErrors
    ];
  }
}

module.exports = new ValidationMiddleware();
