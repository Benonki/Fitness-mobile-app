import React, { useContext, useEffect } from 'react';
import { View, Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';

import DietaScreen from '../../src/screens/Dieta';
import { UserProvider, UserContext } from '../../src/context/UserContext';
import { StepProvider } from '../../src/context/StepContext';
import { ProductProvider } from '../../src/context/ProductContext';
import { NotificationsProvider } from '../../src/context/NotificationContext';

import * as StepsApi from '../../src/api/steps';
import * as NotificationsApi from '../../src/api/notifications';
import * as EatedProductsApi from '../../src/api/eatedProducts';

import * as Notifications from 'expo-notifications';
import { Pedometer } from 'expo-sensors';

jest.mock('../../src/api/steps');
jest.mock('../../src/api/notifications');
jest.mock('../../src/api/eatedProducts');
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

jest.mock('react-native-circular-progress-indicator', () => {
    const { Text, View } = require('react-native');
    return ({ value, title }) => (
        <View>
            <Text testID="progress-value">{value}</Text>
            <Text testID="progress-title">{title}</Text>
        </View>
    );
});

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

let stepCallback = null;
jest.mock('expo-sensors', () => ({
    Pedometer: {
        isAvailableAsync: jest.fn(() => Promise.resolve(true)),
        getStepCountAsync: jest.fn(() => Promise.resolve({ steps: 0 })),
        watchStepCount: jest.fn((callback) => {
            stepCallback = callback;
            return { remove: jest.fn() };
        })
    }
}));

const UserInitializer = ({ stepsGoal }) => {
    const { setUser } = useContext(UserContext);
    useEffect(() => {
        setUser({
            id: 'u1',
            login: 'runner',
            weight: 70,
            height: 175,
            stepsGoal: stepsGoal,
            exercises: 5,
            gender: 'Mężczyzna',
            dateOfBirth: '01.01.1995',
            objective: 'Utrata wagi',
            notificationFlags: { stepsGoalSent: false },
            eatenProducts: []
        });
    }, []);
    return null;
};

const StepIntegrationApp = () => {
    const mockNavigation = { navigate: jest.fn() };

    return (
        <UserProvider>
            <NotificationsProvider>
                <ProductProvider>
                    <StepProvider>
                        <UserInitializer stepsGoal={100} />
                        <DietaScreen navigation={mockNavigation} />
                    </StepProvider>
                </ProductProvider>
            </NotificationsProvider>
        </UserProvider>
    );
};

describe('Proces osiągniecia celu kroków', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        stepCallback = null;

        StepsApi.loadStepData.mockResolvedValue(0);
        StepsApi.saveSteps.mockResolvedValue(true);
        NotificationsApi.loadNotifications.mockResolvedValue([]);
        NotificationsApi.addNotification.mockResolvedValue([]);
        NotificationsApi.setNotificationFlag.mockResolvedValue({});
        EatedProductsApi.loadProductsFromAPI.mockResolvedValue({ eatenProducts: [] });
    });

    it('powinien zaktualizować licznik kroków i wysłać gratulacje po osiągnięciu celu', async () => {
        const { getByText, getByTestId } = render(<StepIntegrationApp />);

        await waitFor(() => expect(Pedometer.watchStepCount).toHaveBeenCalled());
        expect(getByTestId('progress-value').children[0]).toBe('0');

        await act(async () => {
            if (stepCallback) {
                stepCallback({ steps: 50 });
            }
        });

        await waitFor(() => {
            expect(getByTestId('progress-value').children[0]).toBe('50');
        });

        expect(getByText(/Dystans Przebyty : 0.0385 km/)).toBeTruthy();
        expect(getByText(/Spalone Kalorie : 2.3100/)).toBeTruthy();

        await act(async () => {
            if (stepCallback) {
                stepCallback({ steps: 110 });
            }
        });

        await waitFor(() => {
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        title: "Gratulacje! 😀",
                        body: "Osiągnąłeś swój cel kroków 👟!!!"
                    })
                })
            );
        });

        expect(NotificationsApi.setNotificationFlag).toHaveBeenCalledWith(
            'u1',
            'stepsGoalSent',
            true
        );
    });
});