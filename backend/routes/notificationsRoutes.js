const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/notifications/{userId}:
 *   get:
 *     summary: Pobiera powiadomienia użytkownika
 *     description: Endpoint do pobierania wszystkich powiadomień użytkownika z informacjami o tytule, treści i dacie
 *     tags: [Notifications]
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
 *         description: Lista powiadomień
 *       401:
 *         description: Brak autoryzacji
 *       500:
 *         description: Błąd serwera
 */
router.get('/:userId', notificationsController.getNotifications);

/**
 * @swagger
 * /api/notifications/{userId}/add:
 *   post:
 *     summary: Dodaje nowe powiadomienie
 *     description: Endpoint do tworzenia nowego powiadomienia dla użytkownika z automatycznym przypisaniem daty i ID
 *     tags: [Notifications]
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
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Powiadomienie dodane pomyślnie
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Błąd w danych wejściowych
 */
router.post('/:userId/add', notificationsController.addNotification);

/**
 * @swagger
 * /api/notifications/{userId}/{notificationId}:
 *   delete:
 *     summary: Usuwa powiadomienie
 *     description: Endpoint do usuwania konkretnego powiadomienia użytkownika na podstawie ID powiadomienia
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Powiadomienie usunięte pomyślnie
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Błąd podczas usuwania
 */
router.delete('/:userId/:notificationId', notificationsController.deleteNotification);

/**
 * @swagger
 * /api/notifications/{userId}/notification-flags:
 *   patch:
 *     summary: Aktualizuje flagi powiadomień
 *     description: Endpoint do aktualizacji flag systemowych powiadomień takich birthdaySent, stepsGoalSent, caloriesGoalSent
 *     tags: [Notifications]
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
 *               - flagName
 *               - value
 *             properties:
 *               flagName:
 *                 type: string
 *                 enum: [birthdaySent, stepsGoalSent, caloriesGoalSent]
 *               value:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Flaga zaktualizowana pomyślnie
 *       401:
 *         description: Brak autoryzacji
 *       400:
 *         description: Błąd podczas aktualizacji
 */
router.patch('/:userId/notification-flags', notificationsController.updateNotificationFlag);

module.exports = router;