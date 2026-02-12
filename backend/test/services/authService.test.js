const authService = require('../../services/authService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../../models/User', () => {
    const mockUserConstructor = jest.fn();
    mockUserConstructor.findOne = jest.fn();
    return mockUserConstructor;
});
const User = require('../../models/User');

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';
        process.env.JWT_EXPIRES_IN = '1h';
    });

    describe('verifyToken', () => {
        it('powinien rzucić błąd "Token wygasł" przy TokenExpiredError', async () => {
            const error = new Error('Expired');
            error.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => { throw error; });

            await expect(authService.verifyToken('expired_token'))
                .rejects.toThrow('Token wygasł');
        });
    });

    describe('getUserInfo', () => {
        it('powinien zwrócić dane użytkownika po weryfikacji tokena', async () => {
            const mockUser = {
                _id: '123',
                login: 'testuser',
                name: 'Test',
                notificationFlags: { birthdaySent: true }
            };

            jwt.verify.mockReturnValue({ userId: '123' });
            User.findOne.mockResolvedValue(mockUser);

            const result = await authService.getUserInfo('testuser', 'valid_token');

            expect(User.findOne).toHaveBeenCalledWith({ login: 'testuser' });
            expect(result.login).toBe('testuser');
            expect(result.id).toBe('123');
        });

        it('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
            jwt.verify.mockReturnValue({});
            User.findOne.mockResolvedValue(null);

            await expect(authService.getUserInfo('unknown', 'token'))
                .rejects.toThrow('Użytkownik nie znaleziony');
        });
    });

    describe('login', () => {
        it('powinien zalogować użytkownika i zwrócić token', async () => {
            const mockUser = {
                _id: '123',
                login: 'user',
                password: 'hashedpassword',
                name: 'User'
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('new_token');

            const result = await authService.login('user', 'password');

            expect(User.findOne).toHaveBeenCalledWith({ login: 'user' });
            expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
            expect(result.success).toBe(true);
            expect(result.token).toBe('new_token');
            expect(result.user.login).toBe('user');
        });

        it('powinien rzucić błąd gdy hasło jest nieprawidłowe', async () => {
            User.findOne.mockResolvedValue({ password: 'hash' });
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.login('user', 'wrongpass'))
                .rejects.toThrow('Nieprawidłowy login lub hasło');
        });
    });

    describe('checkLoginAvailability', () => {
        it('powinien zwrócić false jeśli login jest zajęty', async () => {
            User.findOne.mockResolvedValue({ _id: '123' });

            const result = await authService.checkLoginAvailability('taken');
            expect(result.available).toBe(false);
        });

        it('powinien rzucić błąd gdy login nie podany', async () => {
            await expect(authService.checkLoginAvailability(''))
                .rejects.toThrow('Login jest wymagany');
        });
    });
});