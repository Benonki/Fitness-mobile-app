const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tworzy nowego użytkownika
 *     description: Endpoint do rejestracji nowego użytkownika w systemie z walidacją danych
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *               - name
 *               - lastName
 *             properties:
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               objective:
 *                 type: string
 *               gender:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Użytkownik został utworzony
 *       400:
 *         description: Błąd w danych wejściowych
 */
router.post('/', userController.createUser);

router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Pobiera dane użytkownika
 *     description: Endpoint do pobierania pełnych danych użytkownika na podstawie ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dane użytkownika
 *       401:
 *         description: Brak autoryzacji
 *       500:
 *         description: Błąd serwera
 */
router.get('/:userId', userController.getUser);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Aktualizuje dane użytkownika
 *     description: Endpoint do aktualizacji danych profilowych użytkownika wraz z obsługą zdjęcia profilowego
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               imageUri:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dane użytkownika zaktualizowane
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Błąd w danych wejściowych
 */
router.put('/:userId', userController.updateUser);

/**
 * @swagger
 * /api/users/{userId}/reset-daily:
 *   patch:
 *     summary: Resetuje dzienne dane użytkownika
 *     description: Endpoint do resetowania dziennych danych użytkownika takich jak kroki, spożyte produkty i flagi powiadomień
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dzienne dane zresetowane pomyślnie
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Błąd podczas resetowania danych
 */
router.patch('/:userId/reset-daily', userController.resetDaily);

module.exports = router;