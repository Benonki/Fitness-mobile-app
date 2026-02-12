import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EkranGlownyScreen from '../../src/screens/EkranGlowny';
import { UserContext } from '../../src/context/UserContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { handleLogout } from '../../src/api/auth';
import { setNotificationFlag } from '../../src/api/notifications';

jest.mock('../../src/context/NotificationContext', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('../../src/api/auth', () => ({
    handleLogout: jest.fn(),
}));

jest.mock('../../src/api/notifications', () => ({
    setNotificationFlag: jest.fn(() => Promise.resolve()),
}));

describe('EkranGlownyScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    };

    const mockUser = {
        id: 'user123',
        name: 'TestowyUser',
        dateOfBirth: '01.01.2000',
        notificationFlags: { birthdaySent: false },
    };

    const mockSetUser = jest.fn();

    const defaultNotificationContext = {
        notifications: { 'user123': [] },
        loadUserNotifications: jest.fn(),
        addUserNotification: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useNotifications.mockReturnValue(defaultNotificationContext);
        jest.useRealTimers();
    });

    it('powinien wyrenderować powitanie z imieniem użytkownika', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <EkranGlownyScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        expect(getByText('Cześć TestowyUser! 👋😀')).toBeTruthy();
    });

    it('nie powinien wyrenderować nic (lub nie wysypać się) gdy brak usera', () => {
        const { queryByText } = render(
            <UserContext.Provider value={{ user: null, setUser: mockSetUser }}>
                <EkranGlownyScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );
        expect(queryByText('Wybór Treningu')).toBeTruthy();
    });


    it('powinien nawigować do "Wybór Treningu"', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <EkranGlownyScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );
        fireEvent.press(getByText('Wybór Treningu'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Wybór Treningu');
    });

    it('powinien nawigować do "Powiadomienia"', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <EkranGlownyScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );
        fireEvent.press(getByText('Powiadomienia'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Powiadomienia');
    });

    it('powinien nawigować do "Śledzenie Diety"', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <EkranGlownyScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );
        fireEvent.press(getByText('Śledzenie Diety'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Śledzenie Diety');
    });

    it('powinien nawigować do "Historia"', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <EkranGlownyScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );
        fireEvent.press(getByText('Historia'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Historia');
    });

    it('powinien wywołać handleLogout po kliknięciu "Wyloguj się"', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <EkranGlownyScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );
        fireEvent.press(getByText('Wyloguj się'));
        expect(handleLogout).toHaveBeenCalledWith(mockSetUser, mockNavigation);
    });

    describe('Logika Urodzinowa', () => {
        const mockDate = (dateString) => {
            const originalToLocaleDateString = Date.prototype.toLocaleDateString;
            jest.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(() => dateString);
            return () => {
                Date.prototype.toLocaleDateString = originalToLocaleDateString;
            };
        };

        it('powinien wysłać powiadomienie urodzinowe, jeśli jest dzisiaj i flaga jest false', async () => {
            const restoreDate = mockDate('01.01.2025');

            render(
                <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                    <EkranGlownyScreen navigation={mockNavigation} />
                </UserContext.Provider>
            );

            await waitFor(() => {
                expect(defaultNotificationContext.addUserNotification).toHaveBeenCalledWith(
                    'user123',
                    expect.objectContaining({
                        title: "Wszystkiego Najlepszego🎉",
                        message: `Wszystkiego najlepszego ${mockUser.name}🎂`
                    })
                );

                expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({
                    notificationFlags: { birthdaySent: true }
                }));

                expect(setNotificationFlag).toHaveBeenCalledWith('user123', 'birthdaySent', true);
            });

            restoreDate();
        });

    });
});