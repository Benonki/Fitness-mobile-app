const express = require('express');
const router = express.Router();
const stepsController = require('../controllers/stepsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/steps/{userId}:
 *   get:
 *     summary: Pobiera liczbę kroków użytkownika
 *     description: Endpoint do pobierania aktualnej liczby kroków użytkownika z bazy danych
 *     tags: [Steps]
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
 *         description: Zwraca liczbę kroków
 *       401:
 *         description: Brak autoryzacji
 *       500:
 *         description: Błąd serwera
 */
router.get('/:userId', stepsController.getSteps);

/**
 * @swagger
 * /api/steps/{userId}/update:
 *   patch:
 *     summary: Aktualizuje liczbę kroków użytkownika
 *     description: Endpoint do aktualizacji dziennej liczby kroków użytkownika w systemie
 *     tags: [Steps]
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
 *             required:
 *               - stepsTaken
 *             properties:
 *               stepsTaken:
 *                 type: number
 *     responses:
 *       200:
 *         description: Liczba kroków zaktualizowana
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Błąd w danych wejściowych
 */
router.patch('/:userId/update', stepsController.updateSteps);

module.exports = router;