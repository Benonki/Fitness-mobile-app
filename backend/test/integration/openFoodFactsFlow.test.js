const request = require('supertest');
const axios = require('axios');
const jwt = require('jsonwebtoken');

jest.mock('axios');

jest.mock('../../models/User', () => ({
    findById: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123' })
    })
}));

const app = require('../../app');

describe('Proces pobierania danych z OpenFoodFacts', () => {
    const token = 'valid_token';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'user123' });
        process.env.OPENFOODFACTS_API_URL = 'https://fake-api.com';
    });

    describe('Logika filtrowania produktów', () => {
        it('powinien odfiltrować Coca-Colę i produkty wysokokaloryczne dla diety "Utrata wagi"', async () => {
            const mockApiResponse = {
                data: {
                    products: [
                        { product_name: 'Chudy twaróg', nutriments: { 'energy-kcal_100g': 90 } },
                        { product_name: 'Coca-Cola', nutriments: { 'energy-kcal_100g': 40 } },
                        { product_name: 'Burger', nutriments: { 'energy-kcal_100g': 300 } }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockApiResponse);

            const res = await request(app)
                .get('/api/openfoodfacts/diet')
                .query({ dietType: 'Utrata wagi' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            const products = res.body.data;
            expect(products).toHaveLength(1);
            expect(products[0].product_name).toBe('Chudy twaróg');

            expect(axios.get).toHaveBeenCalled();
        });

        it('powinien zwrócić 400 dla nieznanego typu diety', async () => {
            const res = await request(app)
                .get('/api/openfoodfacts/diet')
                .query({ dietType: 'Dieta Czekoladowa' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(400);
            expect(axios.get).not.toHaveBeenCalled();
        });
    });

    describe('GET /search', () => {
        it('powinien wyszukać produkty przekazując zapytanie do API', async () => {
            axios.get.mockResolvedValue({ data: { products: [{ name: 'Test' }] } });

            const res = await request(app)
                .get('/api/openfoodfacts/search')
                .query({ query: 'jabłko' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(1);

            const urlCalled = axios.get.mock.calls[0][0];
            expect(urlCalled).toContain('search_terms=jab%C5%82ko');
        });
    });
});