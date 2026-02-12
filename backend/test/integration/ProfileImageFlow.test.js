const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');

jest.mock('fs', () => {
    const originalFs = jest.requireActual('fs');
    return {
        ...originalFs,
        existsSync: jest.fn(),
        unlinkSync: jest.fn(),
        writeFileSync: jest.fn()
    };
});


jest.mock('../../models/User', () => {
    const UserMock = jest.fn();
    UserMock.findById = jest.fn();
    UserMock.findByIdAndUpdate = jest.fn();
    return UserMock;
});
const User = require('../../models/User');

jest.mock('jsonwebtoken');

const app = require('../../app');

describe('Proces zmiany zdjęcia użytkownika', () => {
    const token = 'valid_token';
    const userId = 'user123';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        jest.spyOn(jwt, 'verify').mockReturnValue({ userId });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: userId })
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Aktualizacja zdjęcia', () => {
        it('powinien przetworzyć Base64, zapisać plik i zaktualizować ścieżkę w bazie', async () => {
            const currentUser = {
                _id: userId,
                imageUri: '/uploads/old_photo.jpg'
            };

            const updatedUser = {
                ...currentUser,
                imageUri: '/uploads/new_photo.jpg'
            };

            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(currentUser),
                ...currentUser
            });

            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(updatedUser)
            });

            fs.existsSync.mockReturnValue(true);

            const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

            const res = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test',
                    lastName: 'User',
                    imageUri: base64Image
                });

            expect(res.statusCode).toEqual(200);

            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('old_photo.jpg'));
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringMatching(/user_user123_\d+\.jpg$/),
                expect.any(Buffer)
            );

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                userId,
                expect.objectContaining({
                    imageUri: expect.stringMatching(/^\/uploads\/user_user123_\d+\.jpg$/)
                }),
                expect.anything()
            );
        });
    });
});