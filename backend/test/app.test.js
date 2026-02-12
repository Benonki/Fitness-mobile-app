const request = require('supertest');
const mongoose = require('mongoose');
const authController = require('../controllers/authController');

jest.mock('../controllers/authController', () => ({
    getUserInfo: jest.fn(),
    login: jest.fn(),
    checkLoginAvailability: jest.fn()
}));

jest.mock('mongoose', () => ({
    connection: {
        readyState: 1
    },
    Schema: jest.fn(),
    model: jest.fn(),
    connect: jest.fn()
}));

const app = require('../app');

describe('App', () => {

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.clearAllMocks();

        authController.checkLoginAvailability.mockImplementation((req, res) => {
            res.status(200).json({ available: true });
        });

        mongoose.connection.readyState = 1;
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('GET /api/status - Gałęzie statusu bazy danych', () => {
        it('powinien zwrócić "Brak połączenia", gdy mongoose.readyState !== 1', async () => {
            mongoose.connection.readyState = 0;

            const res = await request(app).get('/api/status');

            expect(res.statusCode).toEqual(200);
            expect(res.body.dbStatus).toEqual('Brak połączenia');
        });
    });

    describe('Global Error Handler', () => {
        it('powinien przechwycić błąd rzucony w kontrolerze i zwrócić 500', async () => {
            authController.checkLoginAvailability.mockImplementation((req, res, next) => {
                const error = new Error('Testowy błąd krytyczny');
                next(error);
            });

            const res = await request(app).get('/api/auth/check-login?login=crash_test');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({
                success: false,
                message: 'Wewnętrzny błąd serwera',
                error: 'Testowy błąd krytyczny'
            });

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Obsługa błędów 404', () => {
        it('powinien zwrócić 404 dla nieistniejącej ścieżki', async () => {
            const res = await request(app).get('/api/sciezka-ktora-nie-istnieje');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({
                success: false,
                message: 'Nie znaleziono endpointu'
            });
        });
    });

    describe('CORS i Nagłówki Bezpieczeństwa', () => {
        it('powinien obsługiwać CORS dla dozwolonej domeny', async () => {
            const res = await request(app)
                .options('/api/status')
                .set('Origin', 'http://localhost:19006');

            expect(res.headers['access-control-allow-origin']).toEqual('http://localhost:19006');
            expect(res.headers['access-control-allow-credentials']).toEqual('true');
        });

        it('powinien zawierać nagłówki Helmet', async () => {
            const res = await request(app).get('/api/status');
            expect(res.headers).toHaveProperty('x-dns-prefetch-control');
        });
    });

    describe('Logger (Morgan)', () => {
        let originalEnv;

        beforeAll(() => {
            originalEnv = process.env.NODE_ENV;
        });

        afterAll(() => {
            process.env.NODE_ENV = originalEnv;
        });

        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();

            jest.mock('mongoose', () => ({
                connect: jest.fn(),
                connection: { readyState: 1 },
                Schema: jest.fn(),
                model: jest.fn()
            }));

            jest.mock('../controllers/authController', () => ({
                getUserInfo: jest.fn((req, res, next) => next()),
                login: jest.fn((req, res, next) => next()),
                checkLoginAvailability: jest.fn((req, res, next) => next())
            }));

            jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()));
        });

        it('powinien włączyć logger "dev" w środowisku development', () => {
            process.env.NODE_ENV = 'development';

            require('../app');
            const morgan = require('morgan');

            expect(morgan).toHaveBeenCalledWith('dev');
        });

        it('NIE powinien włączać loggera w środowisku test', () => {
            process.env.NODE_ENV = 'test';

            require('../app');
            const morgan = require('morgan');

            expect(morgan).not.toHaveBeenCalled();
        });
    });
});