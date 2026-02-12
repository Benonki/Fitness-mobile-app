import { loadNotifications, addNotification, deleteNotification, setNotificationFlag } from '../../src/api/notifications';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('../../src/api/axiosInstance', () => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
}));

describe('Notifications API', () => {
    const userId = 'user123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadNotifications', () => {
        it('powinien zwrócić pustą tablicę przy braku danych', async () => {
            axiosInstance.get.mockResolvedValue({ data: null });
            const result = await loadNotifications(userId);
            expect(result).toEqual([]);
        });

        it('powinien rzucić błąd, gdy zapytanie się nie powiedzie', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.get.mockRejectedValue(new Error('Load Error'));

            await expect(loadNotifications(userId)).rejects.toThrow('Load Error');

            expect(consoleSpy).toHaveBeenCalledWith('Błąd ładowania powiadomień:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('addNotification', () => {
        it('powinien rzucić błąd podczas dodawania', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const newNote = { title: 'New' };
            axiosInstance.post.mockRejectedValue(new Error('Add Error'));

            await expect(addNotification(userId, newNote)).rejects.toThrow('Add Error');

            expect(consoleSpy).toHaveBeenCalledWith('Błąd dodawania powiadomienia:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('deleteNotification', () => {
        it('powinien rzucić błąd podczas usuwania', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.delete.mockRejectedValue(new Error('Delete Error'));

            await expect(deleteNotification(userId, 123)).rejects.toThrow('Delete Error');

            expect(consoleSpy).toHaveBeenCalledWith('Błąd usuwania powiadomienia:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('setNotificationFlag', () => {
        it('powinien zwrócić null w przypadku błędu', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.patch.mockRejectedValue(new Error('Flag Error'));

            const result = await setNotificationFlag(userId, 'testFlag', true);

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Błąd podczas aktualizacji flagi powiadomienia:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});