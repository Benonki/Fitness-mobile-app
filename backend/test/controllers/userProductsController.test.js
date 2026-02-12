const userProductsController = require('../../controllers/userProductsController');
const userProductsService = require('../../services/userProductsService');

jest.mock('../../services/userProductsService');

describe('UserProductsController', () => {
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

    describe('getUserProducts', () => {
        it('powinien obsłużyć błąd serwisu (500)', async () => {
            userProductsService.getUserProducts.mockRejectedValue(new Error('Fail'));
            await userProductsController.getUserProducts(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateUserProducts', () => {
        it('powinien obsłużyć błąd aktualizacji (400)', async () => {
            userProductsService.updateUserProducts.mockRejectedValue(new Error('Invalid'));
            await userProductsController.updateUserProducts(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});