const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('../../config/config');
const logger = require('../../utils/logger');
const database = require('../../config/database');
const candidateRoutes = require('./routes/candidateRoutes');

const app = express();

app.use(helmet());

app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Candidate Service está funcionando',
    timestamp: new Date().toISOString(),
    service: 'candidate-service',
    version: '1.0.0'
  });
});

app.use('/api/candidates', candidateRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

app.use((error, req, res, next) => {
  logger.error('Erro não tratado:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Recurso já existe'
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referência inválida'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

const PORT = config.services.candidateService.port;

let server;

const startServer = async () => {
  try {
    await database.authenticate();
    logger.info('Conexão com banco de dados estabelecida');

    if (config.env === 'development') {
      await database.sync({ alter: true });
      logger.info('Modelos sincronizados com o banco de dados');
    }

    server = app.listen(PORT, () => {
      logger.info(`Candidate Service rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${config.env}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Porta ${PORT} já está em uso`);
      } else {
        logger.error('Erro no servidor:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Erro ao iniciar Candidate Service:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`Recebido sinal ${signal}. Iniciando shutdown graceful...`);
  
  if (server) {
    server.close(async () => {
      logger.info('Servidor HTTP fechado');
      
      try {
        await database.close();
        logger.info('Conexão com banco de dados fechada');
      } catch (error) {
        logger.error('Erro ao fechar conexão com banco:', error);
      }
      
      logger.info('Candidate Service encerrado com sucesso');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
