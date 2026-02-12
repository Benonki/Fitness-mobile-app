const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../models/User', () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const UserMock = jest.fn();

    const userInstance = {
        _id: 'user123',
        eatenProducts: [],
        save: saveMock
    };

    UserMock.findById = jest.fn().mockReturnValue(userInstance);
    userInstance.select = jest.fn().mockResolvedValue({ _id: 'user123' });

    UserMock.findByIdAndUpdate = jest.fn();
    UserMock.saveRef = saveMock;

    return UserMock;
});

const User = require('../../models/User');
const app = require('../../app');

describe('Procesy dotyczące dziennej aktywności (produkty i kroki)', () => {
    const token = 'valid_token';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'user123' });
    });

    describe('Produkty Spożywcze', () => {
        it('powinien zapisać produkty', async () => {
            const productsPayload = [
                { name: 'Zdrowe', calories: 200 },
                { name: 'Woda', calories: 0 },
                { name: 'Zupa', calories: -100 }
            ];

            const res = await request(app)
                .patch('/api/user-products/user123/update')
                .set('Authorization', `Bearer ${token}`)
                .send({ eatenProducts: productsPayload });

            expect(res.statusCode).toEqual(200);
            expect(User.saveRef).toHaveBeenCalled();
            const userObj = User.findById.mock.results[0].value;

            expect(userObj.eatenProducts).toHaveLength(3);
            expect(userObj.eatenProducts[0].name).toBe('Zdrowe');
            expect(userObj.eatenProducts[0].calories).toBe(200);
        });
    });

    describe('Licznik Kroków', () => {
        it('powinien zaktualizować kroki', async () => {
            User.findByIdAndUpdate.mockResolvedValue({ stepsTaken: 5000 });

            const res = await request(app)
                .patch('/api/steps/user123/update')
                .set('Authorization', `Bearer ${token}`)
                .send({ stepsTaken: 5000 });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ stepsTaken: 5000 });

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123',
                { stepsTaken: 5000 },
                { new: true }
            );
        });
    });
});