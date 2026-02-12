const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../../models/User', () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const UserMock = jest.fn().mockImplementation((data) => ({
        ...data,
        _id: 'new-user-id-123',
        save: saveMock,
        toObject: () => ({ ...data, _id: 'new-user-id-123' })
    }));

    UserMock.findOne = jest.fn();
    UserMock.findById = jest.fn();

    UserMock.saveMockRef = saveMock;

    return UserMock;
});

const User = require('../../models/User');
const app = require('../../app');

describe('Proces autoryzacji', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Rejestracja użytkownika', () => {
        it('powinien przejść przez serwis, zahaszować hasło i zapisać w bazie', async () => {
            const userData = {
                login: 'nowyUser',
                password: 'haslo123',
                name: 'Jan',
                lastName: 'Kowalski',
                weight: 80,
                height: 180,
                objective: 'Utrzymanie wagi',
                gender: 'Mężczyzna',
                dateOfBirth: '1990-01-01'
            };

            User.findOne.mockResolvedValue(null);

            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    _id: 'new-user-id-123',
                    login: 'nowyUser',
                    name: 'Jan'
                })
            });

            const res = await request(app)
                .post('/api/users')
                .send(userData);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('login', 'nowyUser');
            expect(User).toHaveBeenCalled();

            const userInstancePassedToDB = User.mock.calls[0][0];

            expect(userInstancePassedToDB.password).not.toBe('haslo123');
            expect(userInstancePassedToDB.password).toMatch(/^\$2[ayb]\$.{56}$/);

            expect(User.saveMockRef).toHaveBeenCalled();
        });
    });

    describe('Logowanie użytkownika', () => {
        it('powinien zweryfikować hasło hashem i zwrócić token', async () => {
            const realHash = await bcrypt.hash('tajneHaslo', 10);

            const mockUserFromDB = {
                _id: 'user-id-555',
                login: 'testUser',
                password: realHash,
                name: 'Test',
                notificationFlags: {}
            };

            User.findOne.mockResolvedValue(mockUserFromDB);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    login: 'testUser',
                    password: 'tajneHaslo'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('powinien odrzucić błędne hasło', async () => {
            const realHash = await bcrypt.hash('dobreHaslo', 10);

            User.findOne.mockResolvedValue({
                login: 'testUser',
                password: realHash
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    login: 'testUser',
                    password: 'zleHaslo'
                });

            expect(res.statusCode).toEqual(401);
        });
    });
});