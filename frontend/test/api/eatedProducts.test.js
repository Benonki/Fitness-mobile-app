import { loadProductsFromAPI, updateUserProducts } from '../../src/api/eatedProducts';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('../../src/api/axiosInstance', () => ({
    get: jest.fn(),
    patch: jest.fn(),
}));

describe('EatedProducts API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadProductsFromAPI', () => {
        it('powinien pobrać produkty', async () => {
            const mockData = { eatenProducts: [] };
            axiosInstance.get.mockResolvedValue({ data: mockData });

            const result = await loadProductsFromAPI('u1');
            expect(axiosInstance.get).toHaveBeenCalledWith('/user-products/u1');
            expect(result).toEqual(mockData);
        });
    });

    describe('updateUserProducts', () => {
        it('powinien rzucić błąd, gdy aktualizacja się nie uda', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const products = [{ name: 'Apple' }];
            axiosInstance.patch.mockRejectedValue(new Error('Update failed'));

            await expect(updateUserProducts('u1', products)).rejects.toThrow('Update failed');

            expect(consoleSpy).toHaveBeenCalledWith('Błąd podczas aktualizacji produktów:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});