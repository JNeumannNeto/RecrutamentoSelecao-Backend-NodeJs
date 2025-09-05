const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../../../middleware/authMiddleware');
const validationMiddleware = require('../../../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', 
  validationMiddleware.validateRegister,
  authController.register
);

router.post('/login',
  validationMiddleware.validateLogin,
  authController.login
);

router.post('/refresh',
  validationMiddleware.validateRefreshToken,
  authController.refreshToken
);

router.post('/logout',
  authMiddleware.authenticate,
  authController.logout
);

router.get('/profile',
  authMiddleware.authenticate,
  authController.getProfile
);

router.put('/profile',
  authMiddleware.authenticate,
  validationMiddleware.validateProfileUpdate,
  authController.updateProfile
);

router.post('/change-password',
  authMiddleware.authenticate,
  validationMiddleware.validateChangePassword,
  authController.changePassword
);

router.post('/forgot-password',
  validationMiddleware.validateForgotPassword,
  authController.forgotPassword
);

router.post('/reset-password',
  validationMiddleware.validateResetPassword,
  authController.resetPassword
);

module.exports = router;
