require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const userProductsRoutes = require('./routes/userProductsRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const stepsRoutes = require('./routes/stepsRoutes');
const openFoodFactsRoutes = require('./routes/openFoodFactsRoutes');

const app = express();

//Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fitness App API',
      version: '1.0.0'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}/`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, './routes/*.js'),
    path.join(__dirname, './app.js')
  ]
}

const swaggerSpec = swaggerJSDoc(options)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec))

// Middleware
app.use(helmet()); // zabezpieczanie nagłówków HTTP
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // logger
}
app.use(cors({
  origin: [
    'http://localhost:19006',
    /^exp:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100 // Limit każdego IP do 100 żądań na okno czasowe
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-products', userProductsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/steps', stepsRoutes);
app.use('/api/openfoodfacts', openFoodFactsRoutes);

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Sprawdza status serwera i połączenia z bazą danych
 *     description: Endpoint do monitorowania stanu serwera aplikacji oraz połączenia z bazą danych MongoDB
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Status serwera pobrany pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Serwer działa"
 *                 dbStatus:
 *                   type: string
 *                   example: "Połączono"
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Serwer działa',
    dbStatus: mongoose.connection.readyState === 1 ? 'Połączono' : 'Brak połączenia',
    environment: process.env.NODE_ENV
  });
});

// Obsługa błędów 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Nie znaleziono endpointu'
  });
});

// Globalna obsługa błędów
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Wewnętrzny błąd serwera',
    error: err.message
  });
});

module.exports = app;