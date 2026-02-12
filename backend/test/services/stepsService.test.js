const stepsService = require('../../services/stepsService');

jest.mock('../../models/User', () => {
    const mockUserConstructor = jest.fn();
    mockUserConstructor.findById = jest.fn();
    mockUserConstructor.findByIdAndUpdate = jest.fn();
    return mockUserConstructor;
});
const User = require('../../models/User');

describe('StepsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSteps', () => {
        it('powinien zwrócić liczbę kroków', async () => {
            User.findById.mockResolvedValue({ stepsTaken: 5000 });
            const steps = await stepsService.getSteps('123');
            expect(steps).toBe(5000);
        });

        it('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
            User.findById.mockResolvedValue(null);
            await expect(stepsService.getSteps('123'))
                .rejects.toThrow('Uzytkownik nie znaleziony');
        });
    });

    describe('updateSteps', () => {
        it('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
            User.findByIdAndUpdate.mockResolvedValue(null);
            await expect(stepsService.updateSteps('123', 100))
                .rejects.toThrow('Uzytkownik nie znaleziony');
        });
    });
});