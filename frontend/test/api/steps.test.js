import { loadStepData, saveSteps } from '../../src/api/steps';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('../../src/api/axiosInstance', () => ({
    get: jest.fn(),
    patch: jest.fn(),
}));

describe('Steps API', () => {
    const userId = 'user123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loadStepData - powinien zwrócić 0, gdy brakuje pola stepsTaken w odpowiedzi', async () => {
        axiosInstance.get.mockResolvedValue({ data: {} });

        const result = await loadStepData(userId);

        expect(result).toBe(0);
    });

    it('saveSteps - powinien zapisać kroki i zwrócić nową wartość', async () => {
        axiosInstance.patch.mockResolvedValue({});
        const result = await saveSteps(userId, 1500);

        expect(axiosInstance.patch).toHaveBeenCalledWith(
            `/steps/${userId}/update`,
            { stepsTaken: 1500 }
        );
        expect(result).toBe(1500);
    });

    it('saveSteps - powinien wejść w blok catch przy błędzie API', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        axiosInstance.patch.mockRejectedValue(new Error('Save Error'));

        await expect(saveSteps(userId, 1500)).rejects.toThrow(ReferenceError);

        expect(consoleSpy).toHaveBeenCalledWith('Error saving step count:', expect.any(Error));
        consoleSpy.mockRestore();
    });
});