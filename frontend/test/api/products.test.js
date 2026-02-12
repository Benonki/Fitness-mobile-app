import { fetchSearchResultsFromAPI, fetchDietProductsFromAPI, fetchProductDataFromAPI } from '../../src/api/products';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('../../src/api/axiosInstance', () => ({
    get: jest.fn(),
}));

describe('Products API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchSearchResultsFromAPI', () => {
        it('powinien zwrócić pustą tablicę, gdy API zwróci odpowiedź bez pola data', async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });

            const result = await fetchSearchResultsFromAPI('unknown');

            expect(result).toEqual([]);
        });

        it('powinien obsłużyć błąd i zwrócić pustą tablicę', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.get.mockRejectedValue(new Error('Search failed'));

            const result = await fetchSearchResultsFromAPI('error');

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching search results:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('fetchDietProductsFromAPI', () => {
        it('powinien zwrócić pustą tablicę, gdy API nie zwróci danych', async () => {
            axiosInstance.get.mockResolvedValue({ data: { data: null } });

            const result = await fetchDietProductsFromAPI('keto');

            expect(result).toEqual([]);
        });

        it('powinien obsłużyć błąd i zwrócić pustą tablicę', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.get.mockRejectedValue(new Error('Diet fetch error'));

            const result = await fetchDietProductsFromAPI('paleo');

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching diet products:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('fetchProductDataFromAPI', () => {
        it('powinien pobrać szczegóły produktu po kodzie kreskowym', async () => {
            const mockProduct = { code: '123456', product_name: 'Test' };
            axiosInstance.get.mockResolvedValue({ data: { data: mockProduct } });

            const result = await fetchProductDataFromAPI('123456');

            expect(axiosInstance.get).toHaveBeenCalledWith('/openfoodfacts/product/123456');
            expect(result).toEqual(mockProduct);
        });

        it('powinien zwrócić null w przypadku błędu sieci/serwera', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.get.mockRejectedValue(new Error('Product not found'));

            const result = await fetchProductDataFromAPI('000');

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching product details:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});