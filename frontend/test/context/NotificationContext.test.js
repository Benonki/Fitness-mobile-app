import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationsProvider, useNotifications } from '../../src/context/NotificationContext';
import * as NotificationsApi from '../../src/api/notifications';
import * as ExpoNotifications from 'expo-notifications';

jest.mock('../../src/api/notifications', () => ({
    loadNotifications: jest.fn(),
    addNotification: jest.fn(),
    deleteNotification: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
}));

const TestConsumer = ({ userId }) => {
    const { notifications, loadUserNotifications, addUserNotification, deleteUserNotification } = useNotifications();

    useEffect(() => {
        if (userId) loadUserNotifications(userId);
    }, [userId]);

    return (
        <View>
            <Text testID="notification-count">
                {notifications[userId] ? notifications[userId].length : 0}
            </Text>
            <Button
                title="Dodaj"
                onPress={() => addUserNotification(userId, { title: 'Test', message: 'Msg' })}
            />
            <Button
                title="Usun"
                onPress={() => deleteUserNotification(userId, 1)}
            />
        </View>
    );
};

describe('NotificationContext', () => {
    const userId = 'user123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien dodać powiadomienie i zaplanować je w Expo', async () => {
        NotificationsApi.loadNotifications.mockResolvedValue([]);
        NotificationsApi.addNotification.mockResolvedValue([{ id: 1, title: 'Test', message: 'Msg' }]);

        const { getByText, getByTestId } = render(
            <NotificationsProvider>
                <TestConsumer userId={userId} />
            </NotificationsProvider>
        );

        fireEvent.press(getByText('Dodaj'));

        await waitFor(() => {
            expect(getByTestId('notification-count').children[0]).toBe('1');
        });

        expect(NotificationsApi.addNotification).toHaveBeenCalledWith(userId, { title: 'Test', message: 'Msg' });

        expect(ExpoNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
            content: {
                title: 'Test',
                body: 'Msg',
                data: { navigateTo: 'Powiadomienia' },
                sound: 'default',
            },
            trigger: null,
        }));
    });
});