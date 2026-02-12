import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import PowiadomieniaScreen from '../../src/screens/Powiadomienia';
import { UserContext } from '../../src/context/UserContext';
import { useNotifications } from '../../src/context/NotificationContext';

jest.mock('../../src/context/NotificationContext', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('react-native-elements', () => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');

    return {
        ListItem: Object.assign(
            ({ children, containerStyle }) => <View testID="list-item" style={containerStyle}>{children}</View>,
            {
                Content: ({ children, style }) => <View style={style}>{children}</View>,
                Title: ({ children, style }) => <Text style={style}>{children}</Text>,
                Subtitle: ({ children, style }) => <Text style={style}>{children}</Text>,
            }
        ),
        Icon: ({ name, onPress }) => (
            <TouchableOpacity onPress={onPress} testID={`icon-${name}`}>
                <Text>{name}</Text>
            </TouchableOpacity>
        ),
    };
});

describe('PowiadomieniaScreen', () => {
    const mockUser = { id: 'user123' };
    const mockLoadUserNotifications = jest.fn();
    const mockDeleteUserNotification = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        useNotifications.mockReturnValue({
            notifications: { 'user123': [] },
            loadUserNotifications: mockLoadUserNotifications,
            deleteUserNotification: mockDeleteUserNotification,
        });
    });

    it('powinien wyświetlić listę powiadomień, gdy są dostępne', () => {
        const mockData = [
            { id: 1, title: 'Witaj', message: 'Wiadomość testowa', date: '2023-01-01T12:00:00.000Z' }
        ];

        useNotifications.mockReturnValue({
            notifications: { 'user123': mockData },
            loadUserNotifications: mockLoadUserNotifications,
            deleteUserNotification: mockDeleteUserNotification,
        });

        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <PowiadomieniaScreen />
            </UserContext.Provider>
        );

        expect(getByText('Witaj')).toBeTruthy();
        expect(getByText('Wiadomość testowa')).toBeTruthy();
        expect(getByText(/2023/)).toBeTruthy();
    });

    it('powinien wywołać deleteUserNotification po kliknięciu ikony usuwania', () => {
        const mockData = [
            { id: 101, title: 'Do usunięcia', message: 'Delete me', date: null }
        ];

        useNotifications.mockReturnValue({
            notifications: { 'user123': mockData },
            loadUserNotifications: mockLoadUserNotifications,
            deleteUserNotification: mockDeleteUserNotification,
        });

        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <PowiadomieniaScreen />
            </UserContext.Provider>
        );

        const deleteBtn = getByTestId('icon-close');
        fireEvent.press(deleteBtn);

        expect(mockDeleteUserNotification).toHaveBeenCalledWith('user123', 101);
    });

    it('powinien wyświetlić teksty zastępcze dla brakujących danych', () => {
        const incompleteData = [
            { id: 202, title: null, message: undefined, date: null }
        ];

        useNotifications.mockReturnValue({
            notifications: { 'user123': incompleteData },
            loadUserNotifications: mockLoadUserNotifications,
            deleteUserNotification: mockDeleteUserNotification,
        });

        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <PowiadomieniaScreen />
            </UserContext.Provider>
        );

        expect(getByText('Brak tytułu')).toBeTruthy();
        expect(getByText('Brak wiadomości')).toBeTruthy();
        expect(getByText('Brak daty')).toBeTruthy();
    });

    it('nie powinien wysypać się, gdy notifications dla danego usera są undefined', () => {
        useNotifications.mockReturnValue({
            notifications: {},
            loadUserNotifications: mockLoadUserNotifications,
            deleteUserNotification: mockDeleteUserNotification,
        });

        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <PowiadomieniaScreen />
            </UserContext.Provider>
        );

        expect(getByText('Brak powiadomień')).toBeTruthy();
    });
});