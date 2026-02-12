const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth:
 *   get:
 *     summary: Pobiera informacje o użytkowniku na podstawie tokenu JWT
 *     description: Endpoint do pobierania danych użytkownika po weryfikacji tokenu JWT z nagłówka Authorization
 *     tags: [Authentication]
 *     parameters:
 *       - name: login
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dane użytkownika pobrane pomyślnie
 *       401:
 *         description: Token wygasł lub nieprawidłowy
 *       500:
 *         description: Błąd serwera
 */
router.get('/', authController.getUserInfo);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Loguje użytkownika do systemu
 *     description: Endpoint do logowania użytkownika i generowania tokena JWT po uwierzytelnieniu
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logowanie udane, zwraca token i dane użytkownika
 *       401:
 *         description: Błąd podczas logowania
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/check-login:
 *   get:
 *     summary: Sprawdza dostępność loginu
 *     description: Endpoint do weryfikacji czy login jest dostępny podczas rejestracji nowego użytkownika
 *     tags: [Authentication]
 *     parameters:
 *       - name: login
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zwraca informację czy login jest dostępny
 *       401:
 *         description: Błąd podczas sprawdzania loginu
 */
router.get('/check-login', authController.checkLoginAvailability);

module.exports = router;