import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/Login';
import { UserContext } from '../../src/context/UserContext';
import * as AuthApi from '../../src/api/auth';

jest.mock('../../src/api/auth', () => ({
    checkStoredData: jest.fn(),
    handleLogin: jest.fn(),
}));

jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props) => <View {...props} testID="mock-svg" />,
        Defs: 'Defs',
        LinearGradient: 'LinearGradient',
        Stop: 'Stop',
        Text: 'Text',
    };
});

jest.mock('react-native-paper', () => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return {
        Checkbox: ({ status, onPress }) => (
            <TouchableOpacity onPress={onPress} testID="mock-checkbox">
                <Text>{status === 'checked' ? '[X]' : '[ ]'}</Text>
            </TouchableOpacity>
        ),
        Snackbar: ({ visible, children }) => (
            visible ? <View testID="mock-snackbar"><Text>{children}</Text></View> : null
        ),
    };
});

describe('LoginScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    };
    const mockSetUser = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        AuthApi.checkStoredData.mockImplementation((setUser, nav, setLoading) => {
            setLoading(false);
        });
    });


    it('powinien obsługiwać checkbox autologowania', async () => {
        const { getByTestId, getByText } = render(
            <UserContext.Provider value={{ setUser: mockSetUser }}>
                <LoginScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const checkbox = getByTestId('mock-checkbox');

        expect(getByText('[ ]')).toBeTruthy();

        fireEvent.press(checkbox);
        expect(getByText('[X]')).toBeTruthy();

        fireEvent.press(checkbox);
        expect(getByText('[ ]')).toBeTruthy();
    });

    it('powinien wywołać handleLogin z poprawnymi danymi po kliknięciu przycisku', async () => {
        const { getByText, getByPlaceholderText, getByTestId } = render(
            <UserContext.Provider value={{ setUser: mockSetUser }}>
                <LoginScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        fireEvent.changeText(getByPlaceholderText('Login'), 'myUser');
        fireEvent.changeText(getByPlaceholderText('Hasło'), 'myPass');

        fireEvent.press(getByTestId('mock-checkbox'));

        fireEvent.press(getByText('Zaloguj się'));

        expect(AuthApi.handleLogin).toHaveBeenCalledWith(
            'myUser',
            'myPass',
            mockSetUser,
            expect.any(Function),
            expect.any(Function),
            mockNavigation,
            true
        );
    });

    it('powinien nawigować do rejestracji po kliknięciu w link', async () => {
        const { getByText } = render(
            <UserContext.Provider value={{ setUser: mockSetUser }}>
                <LoginScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        fireEvent.press(getByText('Zarejestruj się'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Rejestracja');
    });
});