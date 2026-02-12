const openFoodFactsController = require('../../controllers/openFoodFactsController');
const openFoodFactsService = require('../../services/openFoodFactsService');

jest.mock('../../services/openFoodFactsService');

describe('OpenFoodFactsController', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {}, params: {} };
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

    describe('searchProducts', () => {
        it('powinien zwrócić produkty przy poprawnym zapytaniu', async () => {
            req.query.query = 'apple';
            openFoodFactsService.searchProducts.mockResolvedValue(['apple1']);

            await openFoodFactsController.searchProducts(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: ['apple1'] });
        });

        it('powinien obsłużyć błąd serwera (500)', async () => {
            req.query.query = 'apple';
            openFoodFactsService.searchProducts.mockRejectedValue(new Error('API fail'));

            await openFoodFactsController.searchProducts(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getProductByBarcode', () => {
        it('powinien zwrócić błąd 400 gdy brak barcode', async () => {
            await openFoodFactsController.getProductByBarcode(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('powinien zwrócić błąd 404 gdy produkt nie istnieje', async () => {
            req.params.barcode = '123';
            openFoodFactsService.getProductByBarcode.mockResolvedValue(null);

            await openFoodFactsController.getProductByBarcode(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Nie znaleziono produktu' }));
        });

        it('powinien zwrócić produkt gdy istnieje', async () => {
            req.params.barcode = '123';
            openFoodFactsService.getProductByBarcode.mockResolvedValue({ name: 'Product' });

            await openFoodFactsController.getProductByBarcode(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: { name: 'Product' } });
        });
    });
});