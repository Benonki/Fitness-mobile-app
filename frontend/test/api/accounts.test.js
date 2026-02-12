import { getUserData, updateUserData, checkAndResetDailyData } from '../../src/api/accounts';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('../../src/api/axiosInstance', () => ({
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
}));

describe('Accounts API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserData', () => {
        it('powinien pobrać dane użytkownika', async () => {
            const mockData = { id: 1, name: 'Test' };
            axiosInstance.get.mockResolvedValue({ data: mockData });

            const result = await getUserData(1);

            expect(axiosInstance.get).toHaveBeenCalledWith('/users/1');
            expect(result).toEqual(mockData);
        });
    });

    describe('updateUserData', () => {
        it('powinien rzucić błąd, gdy aktualizacja się nie uda', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.put.mockRejectedValue(new Error('Update failed'));

            await expect(updateUserData(1, { weight: 90 })).rejects.toThrow('Nie udało się zaktualizować danych użytkownika');

            consoleSpy.mockRestore();
        });
    });

    describe('checkAndResetDailyData', () => {
        it('powinien wywołać reset-daily, jeśli lastSyncDate jest inna', async () => {
            const oldDate = '2000-01-01';
            const currentUserData = { id: 1, lastSyncDate: oldDate };

            const apiResponse = { user: { id: 1, lastSyncDate: '2025-01-01' } };
            axiosInstance.patch.mockResolvedValue({ data: apiResponse });

            const result = await checkAndResetDailyData(1, currentUserData);

            expect(axiosInstance.patch).toHaveBeenCalledWith('/users/1/reset-daily');
            expect(result).toEqual(apiResponse.user);
        });

        it('powinien wykonać reset bez sprawdzania daty, jeśli currentUserData jest null', async () => {
            const apiResponse = { user: { id: 1, lastSyncDate: '2025-01-01' } };
            axiosInstance.patch.mockResolvedValue({ data: apiResponse });

            const result = await checkAndResetDailyData(1, null);

            expect(axiosInstance.patch).toHaveBeenCalledWith('/users/1/reset-daily');
            expect(result).toEqual(apiResponse.user);
        });

        it('powinien zwrócić bezpośrednio response.data, jeśli brak pola .user w odpowiedzi', async () => {
            const oldDate = '2000-01-01';
            const currentUserData = { id: 1, lastSyncDate: oldDate };

            const flatResponse = { id: 1, lastSyncDate: '2025-01-01', reset: true };
            axiosInstance.patch.mockResolvedValue({ data: flatResponse });

            const result = await checkAndResetDailyData(1, currentUserData);

            expect(result).toEqual(flatResponse);
        });

        it('powinien zwrócić stare dane w przypadku błędu API', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const currentUserData = { id: 1, lastSyncDate: '2000-01-01' };

            axiosInstance.patch.mockRejectedValue(new Error('Reset failed'));

            const result = await checkAndResetDailyData(1, currentUserData);

            expect(result).toEqual(currentUserData);
            consoleSpy.mockRestore();
        });
    });
});