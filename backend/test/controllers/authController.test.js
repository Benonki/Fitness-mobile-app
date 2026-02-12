const authController = require('../../controllers/authController');
const authService = require('../../services/authService');

jest.mock('../../services/authService');

describe('AuthController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, query: {}, headers: { authorization: 'Bearer token123' } };
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

    describe('getUserInfo', () => {
        it('powinien zwrócić 500 dla innych błędów', async () => {
            authService.getUserInfo.mockRejectedValue(new Error('Database down'));
            await authController.getUserInfo(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });


    describe('login', () => {
        it('powinien obsłużyć błąd logowania jako 401', async () => {
            authService.login.mockRejectedValue(new Error('Bad credentials'));

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('checkLoginAvailability', () => {
        it('powinien obsłużyć błąd jako 401', async () => {
            authService.checkLoginAvailability.mockRejectedValue(new Error('Fail'));

            await authController.checkLoginAvailability(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });
});