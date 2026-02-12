const stepsController = require('../../controllers/stepsController');
const stepsService = require('../../services/stepsService');

jest.mock('../../services/stepsService');

describe('StepsController', () => {
    let req, res;

    beforeEach(() => {
        req = { user: { _id: '123' }, body: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('getSteps', () => {
        it('powinien zwrócić błąd 500 przy błędzie serwisu', async () => {
            stepsService.getSteps.mockRejectedValue(new Error('DB Error'));

            await stepsController.getSteps(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'DB Error' });
        });
    });

    describe('updateSteps', () => {
        it('powinien zwrócić błąd 400 przy błędzie serwisu', async () => {
            req.body.stepsTaken = -5;
            stepsService.updateSteps.mockRejectedValue(new Error('Invalid value'));

            await stepsController.updateSteps(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid value' });
        });
    });
});