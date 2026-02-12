const notificationsService = require('../../services/notificationsService');

jest.mock('../../models/User', () => {
    const mockUserConstructor = jest.fn();
    mockUserConstructor.findById = jest.fn();
    mockUserConstructor.findByIdAndUpdate = jest.fn();
    return mockUserConstructor;
});
const User = require('../../models/User');

describe('NotificationsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getNotifications', () => {
        it('powinien zwrócić listę powiadomień', async () => {
            const mockNotifications = [{ id: 1, title: 'Test' }];
            User.findById.mockResolvedValue({ notifications: mockNotifications });

            const result = await notificationsService.getNotifications('123');
            expect(result).toEqual(mockNotifications);
        });

        it('powinien zwrócić pustą tablicę jeśli brak powiadomień', async () => {
            User.findById.mockResolvedValue({});
            const result = await notificationsService.getNotifications('123');
            expect(result).toEqual([]);
        });

        it('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
            User.findById.mockResolvedValue(null);
            await expect(notificationsService.getNotifications('123'))
                .rejects.toThrow('Uzytkownik nie znaleziony');
        });
    });

    describe('addNotification', () => {
        it('powinien dodać powiadomienie i zwrócić zaktualizowaną listę', async () => {
            const updatedUser = { notifications: [{ id: expect.any(Number), title: 'Nowe' }] };

            User.findByIdAndUpdate.mockResolvedValue(updatedUser);

            const result = await notificationsService.addNotification('123', 'Nowe', 'Treść');

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                '123',
                { $push: { notifications: expect.objectContaining({ title: 'Nowe', message: 'Treść' }) } },
                { new: true }
            );
            expect(result).toEqual(updatedUser.notifications);
        });

    });

    describe('updateNotificationFlag', () => {
        it('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
            User.findByIdAndUpdate.mockResolvedValue(null);

            await expect(notificationsService.updateNotificationFlag('123', 'flag', true))
                .rejects.toThrow('Użytkownik nie znaleziony');
        });
    });
});