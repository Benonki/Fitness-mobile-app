import React, { useContext, useEffect } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { UserProvider, UserContext } from '../../src/context/UserContext';
import { NotificationsProvider, useNotifications } from '../../src/context/NotificationContext';

import * as NotificationsApi from '../../src/api/notifications';
import * as Notifications from 'expo-notifications';

jest.mock('../../src/api/notifications');
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

const MockNotificationScreen = () => {
    const { user } = useContext(UserContext);
    const { notifications, loadUserNotifications, deleteUserNotification, addUserNotification } = useNotifications();

    useEffect(() => {
        if (user) {
            loadUserNotifications(user.id);
        }
    }, [user]);

    const userNotifications = user && notifications[user.id] ? notifications[user.id] : [];

    return (
        <View>
            <Text>Lista Powiadomień</Text>
            <Button
                title="Dodaj Testowe"
                onPress={() => addUserNotification(user.id, {
                    id: 999,
                    title: "Nowe",
                    message: "Test Wiadomości"
                })}
            />

            <FlatList
                data={userNotifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View testID={`notification-${item.id}`}>
                        <Text>{item.title}</Text>
                        <Text>{item.message}</Text>
                        <Button
                            title="Usuń"
                            onPress={() => deleteUserNotification(user.id, item.id)}
                        />
                    </View>
                )}
            />
        </View>
    );
};

const UserInitializer = () => {
    const { setUser } = useContext(UserContext);
    useEffect(() => {
        setUser({ id: 'u1', login: 'tester' });
    }, []);
    return null;
};

const IntegrationApp = () => (
    <UserProvider>
        <NotificationsProvider>
            <UserInitializer />
            <MockNotificationScreen />
        </NotificationsProvider>
    </UserProvider>
);

describe('Proces dodawania i usuwania powiadomień', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien pobrać listę, wyświetlić ją, a następnie usunąć powiadomienie', async () => {
        const mockServerData = [
            { id: 1, title: 'Wypij wodę', message: 'Czas na szklankę wody!' },
            { id: 2, title: 'Trening', message: 'Zrób 10 przysiadów' }
        ];

        NotificationsApi.loadNotifications.mockResolvedValue(mockServerData);

        const { getByText, queryByText, getAllByText } = render(<IntegrationApp />);

        await waitFor(() => expect(getByText('Wypij wodę')).toBeTruthy());
        expect(getByText('Trening')).toBeTruthy();

        expect(NotificationsApi.loadNotifications).toHaveBeenCalledWith('u1');

        const updatedServerData = [
            { id: 2, title: 'Trening', message: 'Zrób 10 przysiadów' }
        ];
        NotificationsApi.deleteNotification.mockResolvedValue(updatedServerData);

        const deleteButtons = getAllByText('Usuń');
        fireEvent.press(deleteButtons[0]);

        await waitFor(() => {
            expect(NotificationsApi.deleteNotification).toHaveBeenCalledWith('u1', 1);
        });

        await waitFor(() => {
            expect(queryByText('Wypij wodę')).toBeNull();
        });
        expect(getByText('Trening')).toBeTruthy();
    });

    it('powinien dodać nowe powiadomienie i zlecić wyświetlenie w systemie', async () => {
        NotificationsApi.loadNotifications.mockResolvedValue([]);

        const { getByText } = render(<IntegrationApp />);
        const newNotification = { id: 999, title: "Nowe", message: "Test Wiadomości" };
        NotificationsApi.addNotification.mockResolvedValue([newNotification]);

        fireEvent.press(getByText('Dodaj Testowe'));

        await waitFor(() => {
            expect(NotificationsApi.addNotification).toHaveBeenCalledWith('u1', expect.objectContaining({
                title: "Nowe"
            }));
        });

        await waitFor(() => expect(getByText('Test Wiadomości')).toBeTruthy());

        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.objectContaining({
                    title: "Nowe",
                    body: "Test Wiadomości",
                    data: { navigateTo: 'Powiadomienia' }
                })
            })
        );
    });
});