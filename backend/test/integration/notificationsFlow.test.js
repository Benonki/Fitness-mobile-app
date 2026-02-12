const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../models/User', () => {
    const UserMock = jest.fn();

    UserMock.findById = jest.fn();
    UserMock.findByIdAndUpdate = jest.fn();

    return UserMock;
});

const User = require('../../models/User');
const app = require('../../app');

describe('Proces zarządzania powiadomieniami i flagami', () => {
    const token = 'valid_token';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});

        jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'user123' });

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'user123' })
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Zarządzanie powiadomieniami', () => {
        it('powinien dodać powiadomienie do tablicy użytkownika', async () => {
            User.findByIdAndUpdate.mockResolvedValue({
                notifications: [
                    { id: 123, title: 'Test', message: 'Msg', date: '2025-01-01' }
                ]
            });

            const res = await request(app)
                .post('/api/notifications/user123/add')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Test', message: 'Msg' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(1);

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123',
                {
                    $push: {
                        notifications: expect.objectContaining({
                            title: 'Test',
                            message: 'Msg',
                            id: expect.any(Number)
                        })
                    }
                },
                expect.any(Object)
            );
        });

        it('powinien usunąć powiadomienie', async () => {
            User.findByIdAndUpdate.mockResolvedValue({ notifications: [] });

            const res = await request(app)
                .delete('/api/notifications/user123/999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123',
                { $pull: { notifications: { id: 999 } } },
                expect.any(Object)
            );
        });
    });

    describe('Flagi powiadomień', () => {
        it('powinien zaktualizować flagę', async () => {
            User.findByIdAndUpdate.mockResolvedValue({ _id: 'user123' });

            const res = await request(app)
                .patch('/api/notifications/user123/notification-flags')
                .set('Authorization', `Bearer ${token}`)
                .send({ flagName: 'birthdaySent', value: true });

            expect(res.statusCode).toEqual(200);

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123',
                { $set: { 'notificationFlags.birthdaySent': true } },
                expect.any(Object)
            );
        });
    });
});