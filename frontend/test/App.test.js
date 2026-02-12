import React from 'react';
import { View, Text, Platform } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import App from '../App';
import * as Notifications from 'expo-notifications';

const mockNavigate = jest.fn();
const mockIsReady = jest.fn();

jest.mock('@react-navigation/native', () => {
    const React = require('react');
    const { View } = require('react-native');
    const actual = jest.requireActual('@react-navigation/native');

    const MockNavigationContainer = React.forwardRef(({ children }, ref) => {
        React.useImperativeHandle(ref, () => ({
            isReady: mockIsReady,
            navigate: mockNavigate,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            current: {},
        }));
        return <View>{children}</View>;
    });

    return {
        ...actual,
        useNavigationContainerRef: () => ({
            isReady: mockIsReady,
            navigate: mockNavigate,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            current: null,
        }),
        NavigationContainer: MockNavigationContainer,
    };
});

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    removeNotificationSubscription: jest.fn(),
    AndroidImportance: { MAX: 5 },
}));

jest.mock('../src/routes/StackNav', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return () => <View><Text>Mock Stack Navigation</Text></View>;
});

jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => {
    const React = require('react');
    return jest.fn(() => null);
});

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
    default: jest.fn(),
}));

const createMockProvider = () => {
    const React = require('react');
    return ({ children }) => <>{children}</>;
};

jest.mock('../src/context/UserContext', () => ({ UserProvider: createMockProvider() }));
jest.mock('../src/context/NotificationContext', () => ({ NotificationsProvider: createMockProvider() }));
jest.mock('../src/context/ProductContext', () => ({ ProductProvider: createMockProvider() }));
jest.mock('../src/context/StepContext', () => ({ StepProvider: createMockProvider() }));

jest.mock('react-native-paper', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        Provider: ({ children }) => <View>{children}</View>,
        DefaultTheme: {},
        DarkTheme: {},
    };
});

describe('App.js', () => {
    const originalPlatformOS = Platform.OS;

    beforeEach(() => {
        jest.clearAllMocks();
        mockIsReady.mockReturnValue(true);
        global.alert = jest.fn();
    });

    afterEach(() => {
        Object.defineProperty(Platform, 'OS', { get: () => originalPlatformOS });
    });

    it('powinien nawigować do ekranu "Powiadomienia" po kliknięciu w powiadomienie', async () => {
        render(<App />);

        await waitFor(() => expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled());

        const notificationCallback = Notifications.addNotificationResponseReceivedListener.mock.calls[0][0];
        const mockResponse = {
            notification: { request: { content: { data: { navigateTo: 'Powiadomienia' } } } }
        };

        mockIsReady.mockReturnValue(true);

        await act(async () => {
            notificationCallback(mockResponse);
        });

        expect(mockNavigate).toHaveBeenCalledWith('DrawerNav', { screen: 'Powiadomienia' });
    });

    it('powinien ustawić ciemny motyw i jasny StatusBar, gdy system jest w trybie dark', async () => {
        const useColorSchemeMock = require('react-native/Libraries/Utilities/useColorScheme').default;
        useColorSchemeMock.mockReturnValue('dark');

        const StatusBarMock = require('react-native/Libraries/Components/StatusBar/StatusBar');

        render(<App />);

        expect(StatusBarMock).toHaveBeenLastCalledWith(
            expect.objectContaining({ barStyle: 'light-content' }),
            expect.anything()
        );
    });

    it('powinien ustawić jasny motyw i ciemny StatusBar, gdy system jest w trybie light', async () => {
        const useColorSchemeMock = require('react-native/Libraries/Utilities/useColorScheme').default;
        useColorSchemeMock.mockReturnValue('light');

        const StatusBarMock = require('react-native/Libraries/Components/StatusBar/StatusBar');

        render(<App />);

        expect(StatusBarMock).toHaveBeenLastCalledWith(
            expect.objectContaining({ barStyle: 'dark-content' }),
            expect.anything()
        );
    });

    it('nie powinien wyrzucić błędu, jeśli powiadomienie nie ma danych', async () => {
        render(<App />);

        const notificationCallback = Notifications.addNotificationResponseReceivedListener.mock.calls[0][0];

        const emptyDataResponse = {
            notification: {
                request: {
                    content: {
                        data: null
                    }
                }
            }
        };

        mockIsReady.mockReturnValue(true);

        await act(async () => {
            notificationCallback(emptyDataResponse);
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});