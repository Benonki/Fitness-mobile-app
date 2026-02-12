const { initializeData } = require('../../data/initialData');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

jest.mock('../../models/User');
jest.mock('bcryptjs');

describe('initializeData', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('powinien dodać użytkownika z zahaszowanym hasłem, gdy baza jest pusta', async () => {
        User.countDocuments.mockResolvedValue(0);
        bcrypt.hash.mockResolvedValue('hashed_password_123');
        await initializeData();

        expect(User.countDocuments).toHaveBeenCalled();
        expect(bcrypt.hash).toHaveBeenCalledWith('Test', 12);

        expect(User.insertMany).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                login: 'Test',
                password: 'hashed_password_123',
                name: 'TestImię'
            })
        ]));

        expect(consoleLogSpy).toHaveBeenCalledWith('Wprowadzono podstawowe dane');
    });

    it('nie powinien dodawać danych, gdy baza nie jest pusta', async () => {
        User.countDocuments.mockResolvedValue(5);

        await initializeData();

        expect(User.countDocuments).toHaveBeenCalled();
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(User.insertMany).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
    });
});