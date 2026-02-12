const express = require('express');
const router = express.Router();
const userProductsController = require('../controllers/userProductsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/user-products/{userId}:
 *   get:
 *     summary: Pobiera listę spożytych produktów użytkownika
 *     description: Endpoint do pobierania historii spożytych produktów użytkownika z danymi żywieniowymi
 *     tags: [Products]
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
 *         description: Lista spożytych produktów
 *       401:
 *         description: Brak autoryzacji
 *       500:
 *         description: Błąd serwera
 */
router.get('/:userId', userProductsController.getUserProducts);

/**
 * @swagger
 * /api/user-products/{userId}/update:
 *   patch:
 *     summary: Aktualizuje listę spożytych produktów
 *     description: Endpoint do aktualizacji dziennej listy spożytych produktów z filtrowaniem produktów o dodatniej wartości kalorycznej
 *     tags: [Products]
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
 *               eatenProducts:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Lista produktów zaktualizowana
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Błąd w danych wejściowych
 */
router.patch('/:userId/update', userProductsController.updateUserProducts);

module.exports = router;