import React from 'react';
import { View, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import LoginScreen from '../../src/screens/Login';
import { UserProvider, UserContext } from '../../src/context/UserContext';
import * as AuthApi from '../../src/api/auth';

jest.mock('../../src/api/auth');

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
}));

jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props) => <View {...props} />,
        Defs: 'Defs', LinearGradient: 'LinearGradient', Stop: 'Stop', Text: 'Text'
    };
});

jest.mock('react-native-paper', () => {
    const React = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return {
        Checkbox: ({ status, onPress }) => (
            <TouchableOpacity onPress={onPress} testID="checkbox">
                <Text>{status}</Text>
            </TouchableOpacity>
        ),
        Snackbar: ({ visible, children }) => visible ? <Text>{children}</Text> : null,
    };
});

jest.mock('../../src/api/eatedProducts', () => ({ loadProductsFromAPI: jest.fn() }));
jest.mock('../../src/api/steps', () => ({ loadStepData: jest.fn() }));
jest.mock('../../src/api/notifications', () => ({ loadNotifications: jest.fn() }));

const IntegrationApp = () => {
    const navigationMock = {
        navigate: jest.fn(),
        replace: jest.fn(),
    };

    return (
        <UserProvider>
            <LoginScreen navigation={navigationMock} />
            <UserContext.Consumer>
                {({ user }) => (
                    user ? <Text testID="user-status">Zalogowano: {user.login}</Text> : <Text testID="user-status">Brak użytkownika</Text>
                )}
            </UserContext.Consumer>
        </UserProvider>
    );
};

describe('Proces logowania', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien przeprowadzić proces logowania i zaktualizować kontekst użytkownika', async () => {
        AuthApi.checkStoredData.mockImplementation((setUser, nav, setLoading) => {
            setLoading(false);
        });

        AuthApi.handleLogin.mockImplementation(async (login, pass, setUser, setMessage, setVisible, navigation) => {
            const fakeUser = { id: 1, login: 'testuser', token: 'fake-token' };
            setUser(fakeUser);
            navigation.navigate('DrawerNav');
        });

        const { getByPlaceholderText, getByText, getByTestId } = render(<IntegrationApp />);

        await waitFor(() => expect(getByPlaceholderText('Login')).toBeTruthy());
        expect(getByTestId('user-status').props.children).toBe('Brak użytkownika');

        fireEvent.changeText(getByPlaceholderText('Login'), 'testuser');
        fireEvent.changeText(getByPlaceholderText('Hasło'), 'password123');

        fireEvent.press(getByText('Zaloguj się'));

        await waitFor(() => {
            expect(AuthApi.handleLogin).toHaveBeenCalledWith(
                'testuser',
                'password123',
                expect.any(Function),
                expect.any(Function),
                expect.any(Function),
                expect.objectContaining({ navigate: expect.any(Function) }),
                false
            );
        });

        await waitFor(() => {
            expect(getByText('Zalogowano: testuser')).toBeTruthy();
        });
    });
});