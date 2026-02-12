import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { StepProvider, StepContext } from '../../src/context/StepContext';
import { UserContext } from '../../src/context/UserContext';
import * as StepsApi from '../../src/api/steps';
import { Pedometer } from 'expo-sensors';
import { PermissionsAndroid, Platform } from 'react-native';
import { useNotifications } from '../../src/context/NotificationContext';

jest.mock('../../src/api/steps', () => ({
    loadStepData: jest.fn(),
    saveSteps: jest.fn(),
}));

jest.mock('../../src/api/notifications', () => ({
    setNotificationFlag: jest.fn(),
}));

jest.mock('../../src/context/NotificationContext', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('expo-sensors', () => ({
    Pedometer: {
        isAvailableAsync: jest.fn(),
        watchStepCount: jest.fn(),
    },
}));

jest.mock('react-native/Libraries/PermissionsAndroid/PermissionsAndroid', () => ({
    request: jest.fn(),
    PERMISSIONS: { ACTIVITY_RECOGNITION: 'ACTIVITY_RECOGNITION' },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
}));

const TestConsumer = () => {
    const { stepCount, pedometerAvailability } = useContext(StepContext);
    return (
        <View>
            <Text testID="step-count">{stepCount}</Text>
            <Text testID="pedometer-status">{pedometerAvailability}</Text>
        </View>
    );
};

describe('StepContext', () => {
    const mockUser = { id: 'user123', stepsGoal: 5000, notificationFlags: { stepsGoalSent: false } };
    const mockSetUser = jest.fn();

    let mockAddUserNotification;

    beforeEach(() => {
        jest.clearAllMocks();
        Platform.OS = 'android';

        Pedometer.watchStepCount.mockReturnValue({ remove: jest.fn() });
        StepsApi.loadStepData.mockResolvedValue(0);
        Pedometer.isAvailableAsync.mockResolvedValue(true);
        PermissionsAndroid.request.mockResolvedValue('granted');

        mockAddUserNotification = jest.fn();
        useNotifications.mockReturnValue({
            addUserNotification: mockAddUserNotification
        });
    });

    it('nie powinien zapisywać kroków w interwale, jeśli ich liczba się nie zmieniła', async () => {
        jest.useFakeTimers();
        StepsApi.loadStepData.mockResolvedValue(100);

        render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <StepProvider>
                    <TestConsumer />
                </StepProvider>
            </UserContext.Provider>
        );

        await waitFor(() => expect(StepsApi.loadStepData).toHaveBeenCalled());

        jest.advanceTimersByTime(60000);
        await Promise.resolve();

        expect(StepsApi.saveSteps).toHaveBeenCalledTimes(1);
        expect(StepsApi.saveSteps).toHaveBeenCalledWith('user123', 100);

        jest.advanceTimersByTime(60000);
        await Promise.resolve();

        expect(StepsApi.saveSteps).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });

    it('powinien zrestartować licznik, gdy zmieni się cel kroków', async () => {
        StepsApi.loadStepData.mockResolvedValue(0);

        const { rerender } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <StepProvider>
                    <TestConsumer />
                </StepProvider>
            </UserContext.Provider>
        );

        await waitFor(() => expect(StepsApi.loadStepData).toHaveBeenCalledTimes(1));

        const updatedUser = { ...mockUser, stepsGoal: 8000 };

        rerender(
            <UserContext.Provider value={{ user: updatedUser, setUser: mockSetUser }}>
                <StepProvider>
                    <TestConsumer />
                </StepProvider>
            </UserContext.Provider>
        );

        await waitFor(() => {
            expect(StepsApi.loadStepData).toHaveBeenCalledTimes(2);
        });
    });
});