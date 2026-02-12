const express = require('express');
const router = express.Router();
const openFoodFactsController = require('../controllers/openFoodFactsController');
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/openfoodfacts/search:
 *   get:
 *     summary: Wyszukuje produkty w bazie Open Food Facts
 *     description: Endpoint do wyszukiwania produktów żywnościowych w zewnętrznej bazie Open Food Facts na podstawie frazy
 *     tags: [Open Food Facts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista znalezionych produktów
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Brak parametru query
 *       500:
 *         description: Błąd podczas wyszukiwania
 */
router.get('/search', openFoodFactsController.searchProducts);

/**
 * @swagger
 * /api/openfoodfacts/diet:
 *   get:
 *     summary: Pobiera produkty odpowiednie dla danego typu diety
 *     description: Endpoint do pobierania produktów z Open Food Facts dopasowanych do konkretnego typu diety z filtrowaniem kalorycznym
 *     tags: [Open Food Facts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dietType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Utrata wagi, Przybieranie na wadze, Utrzymanie wagi]
 *     responses:
 *       200:
 *         description: Lista produktów dla danej diety
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Nieprawidłowy typ diety
 *       500:
 *         description: Błąd podczas pobierania produktów
 */
router.get('/diet', openFoodFactsController.getDietProducts);

/**
 * @swagger
 * /api/openfoodfacts/product/{barcode}:
 *   get:
 *     summary: Pobiera produkt na podstawie kodu kreskowego
 *     description: Endpoint do pobierania szczegółowych informacji o produkcie z Open Food Facts na podstawie kodu kreskowego
 *     tags: [Open Food Facts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dane produktu
 *       401:
 *         description: Brak autoryzacji
 *       404:
 *         description: Produkt nie znaleziony
 *       500:
 *         description: Błąd podczas pobierania produktu
 */
router.get('/product/:barcode', openFoodFactsController.getProductByBarcode);

module.exports = router;