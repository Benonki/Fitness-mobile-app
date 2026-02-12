const openFoodFactsService = require('../../services/openFoodFactsService');
const axios = require('axios');

jest.mock('axios');

describe('OpenFoodFactsService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENFOODFACTS_API_URL = 'https://pl.openfoodfacts.org';

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterAll(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    describe('searchProducts', () => {
        it('powinien zwrócić pustą tablicę, gdy API nie zwróci produktów', async () => {
            axios.get.mockResolvedValue({ data: { products: [] } });

            const result = await openFoodFactsService.searchProducts('nieznany_produkt');

            expect(result).toEqual([]);
        });

        it('powinien rzucić błąd, gdy zapytanie do API się nie powiedzie', async () => {
            axios.get.mockRejectedValue(new Error('Network Error'));

            await expect(openFoodFactsService.searchProducts('test'))
                .rejects.toThrow('Nie udało się pobrać wyników wyszukiwania');

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getDietProducts', () => {
        const mockApiResponse = {
            data: {
                products: [
                    { product_name: 'Chude mleko', nutriments: { 'energy-kcal_100g': 40 } },
                    { product_name: 'Zwykły obiad', nutriments: { 'energy-kcal_100g': 300 } },
                    { product_name: 'Kaloryczny burger', nutriments: { 'energy-kcal_100g': 600 } },
                    { product_name: 'Coca-Cola Zero', nutriments: { 'energy-kcal_100g': 1 } },
                    { product_name: 'Woda', nutriments: null }
                ]
            }
        };

        it('powinien filtrować produkty dla diety "Utrzymanie wagi" (155-500 kcal, bez Coca-Coli)', async () => {
            const specificMock = {
                data: {
                    products: [
                        { product_name: 'Zwykły obiad', nutriments: { 'energy-kcal_100g': 300 } },
                        { product_name: 'Coca-Cola', nutriments: { 'energy-kcal_100g': 200 } }
                    ]
                }
            };
            axios.get.mockResolvedValue(specificMock);

            const result = await openFoodFactsService.getDietProducts('Utrzymanie wagi');

            expect(result).toHaveLength(1);
            expect(result[0].product_name).toBe('Zwykły obiad');
        });

        it('powinien zwrócić pustą tablicę dla nieznanego typu diety', async () => {
            axios.get.mockResolvedValue(mockApiResponse);
            const result = await openFoodFactsService.getDietProducts('Nieznana dieta');
            expect(result).toEqual([]);
        });

        it('powinien obsłużyć brak produktów w odpowiedzi API', async () => {
            axios.get.mockResolvedValue({ data: {} });
            const result = await openFoodFactsService.getDietProducts('Utrata wagi');

            expect(result).toEqual([]);
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Brak produktów'));
        });

        it('powinien rzucić błąd przy awarii API', async () => {
            axios.get.mockRejectedValue(new Error('API fail'));

            await expect(openFoodFactsService.getDietProducts('Utrata wagi'))
                .rejects.toThrow('Nie udało się pobrać produktów dietetycznych');
        });
    });

    describe('getProductByBarcode', () => {
        it('powinien zwrócić null dla błędu 404 (produkt nieznaleziony)', async () => {
            const error404 = new Error('Not Found');
            error404.response = { status: 404 };

            axios.get.mockRejectedValue(error404);

            const result = await openFoodFactsService.getProductByBarcode('000000');

            expect(result).toBeNull();
        });

    });
});