const authMiddleware = require('../../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('AuthMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test_secret';

        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('powinien zwrócić 401, gdy brakuje nagłówka Authorization', async () => {
        req.header.mockReturnValue(null);

        await authMiddleware.authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'MISSING_TOKEN',
            message: 'Brak tokenu autoryzacyjnego'
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('powinien zwrócić 401, gdy użytkownik z tokena nie istnieje w bazie', async () => {
        req.header.mockReturnValue('Bearer valid_token');
        jwt.verify.mockReturnValue({ userId: 'deleted_user_id' });

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });

        await authMiddleware.authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'USER_NOT_FOUND',
            message: 'Użytkownik nie istnieje'
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('powinien zwrócić 401, gdy token wygasł', async () => {
        req.header.mockReturnValue('Bearer expired_token');

        const error = new Error('Expired');
        error.name = 'TokenExpiredError';
        jwt.verify.mockImplementation(() => { throw error; });

        await authMiddleware.authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'TOKEN_EXPIRED',
            message: 'Token wygasł'
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('powinien zwrócić 401, gdy sygnatura tokena jest błędna', async () => {
        req.header.mockReturnValue('Bearer bad_signature_token');

        const error = new Error('Invalid signature');
        error.name = 'JsonWebTokenError';
        jwt.verify.mockImplementation(() => { throw error; });

        await authMiddleware.authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'INVALID_SIGNATURE',
            message: 'Nieprawidłowa sygnatura tokenu'
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('powinien zwrócić 401 dla innych błędów weryfikacji', async () => {
        req.header.mockReturnValue('Bearer error_token');

        jwt.verify.mockImplementation(() => { throw new Error('Unknown Error'); });

        await authMiddleware.authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'INVALID_TOKEN',
            message: 'Nieprawidłowy token'
        }));
        expect(next).not.toHaveBeenCalled();
    });
});