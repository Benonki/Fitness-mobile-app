const notificationsController = require('../../controllers/notificationsController');
const notificationsService = require('../../services/notificationsService');

jest.mock('../../services/notificationsService');

describe('NotificationsController', () => {
    let req, res;

    beforeEach(() => {
        req = { user: { _id: '123' }, body: {}, params: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('getNotifications', () => {
        it('powinien zwrócić błąd 500 przy błędzie serwisu', async () => {
            notificationsService.getNotifications.mockRejectedValue(new Error('Fail'));
            await notificationsController.getNotifications(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('addNotification', () => {
        it('powinien zwrócić błąd 400', async () => {
            notificationsService.addNotification.mockRejectedValue(new Error('Fail'));
            await notificationsController.addNotification(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});