const userController = require('../../controllers/userController');
const userService = require('../../services/userService');

jest.mock('../../services/userService');

describe('UserController', () => {
    let req, res;

    beforeEach(() => {
        req = { user: { _id: '123' }, body: {} };
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

    describe('getUser', () => {
        it('powinien obsłużyć błąd serwisu (500)', async () => {
            userService.getUser.mockRejectedValue(new Error('Fail'));
            await userController.getUser(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
        });
    });

    describe('updateUser', () => {
        it('powinien obsłużyć błąd aktualizacji (400)', async () => {
            userService.updateUser.mockRejectedValue(new Error('Bad data'));
            await userController.updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('resetDaily', () => {
        it('powinien obsłużyć błąd resetowania (400)', async () => {
            userService.resetDaily.mockRejectedValue(new Error('Fail'));
            await userController.resetDaily(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});