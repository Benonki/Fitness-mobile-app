import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RejestracjaScreen from '../../src/screens/Rejestracja';
import { registerUser } from '../../src/api/register';
import { Keyboard } from 'react-native';

jest.mock('../../src/api/register', () => ({
    registerUser: jest.fn(),
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

jest.mock("react-native-modal-datetime-picker", () => {
    const React = require('react');
    const { View, Button } = require('react-native');
    return ({ isVisible, onConfirm, onCancel }) => {
        if (!isVisible) return null;
        return (
            <View testID="mock-date-picker">
                <Button testID="confirm-date-btn" title="Confirm" onPress={() => onConfirm(new Date('2000-05-15'))} />
                <Button testID="cancel-date-btn" title="Cancel" onPress={onCancel} />
            </View>
        );
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
        Snackbar: ({ visible, children }) => (visible ? <View testID="mock-snackbar"><Text>{children}</Text></View> : null),
    };
});

jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const { View, Text } = require('react-native');

    const Picker = ({ selectedValue, onValueChange, children, ...props }) => {
        return (
            <View testID="mock-picker" {...props}>
                <Text testID="picker-current-value">{selectedValue}</Text>
                <Text
                    testID="trigger-picker-change"
                    onPress={(val) => onValueChange(val)}
                >
                    ChangeValue
                </Text>
                {children}
            </View>
        );
    };
    Picker.Item = ({ label }) => <Text>{label}</Text>;
    return { Picker };
});

describe('RejestracjaScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    });

    it('powinien wywołać registerUser z poprawnymi danymi po kliknięciu przycisku', async () => {
        const { getByText, getByPlaceholderText, getByTestId, getAllByTestId } = render(
            <RejestracjaScreen navigation={mockNavigation} />
        );

        fireEvent.changeText(getByPlaceholderText('Login'), 'janusz');
        fireEvent.changeText(getByPlaceholderText('Hasło'), 'haslo123');
        fireEvent.changeText(getByPlaceholderText('Potwierdź Hasło'), 'haslo123');
        fireEvent.changeText(getByPlaceholderText('Imię'), 'Janusz');
        fireEvent.changeText(getByPlaceholderText('Nazwisko'), 'Kowalski');
        fireEvent.changeText(getByPlaceholderText('Waga (kg)'), '90');
        fireEvent.changeText(getByPlaceholderText('Wzrost (cm)'), '185');
        fireEvent.changeText(getByPlaceholderText('Cel kroków'), '6000');
        fireEvent.changeText(getByPlaceholderText('Liczba treningów w tygodniu'), '3');

        fireEvent(getByPlaceholderText('Data Urodzenia (DD-MM-YYYY)'), 'focus');
        fireEvent.press(getByTestId('confirm-date-btn'));
        fireEvent.press(getByTestId('mock-checkbox'));
        const pickerTriggers = getAllByTestId('trigger-picker-change');
        fireEvent.press(pickerTriggers[0], 'Mężczyzna');
        fireEvent.press(pickerTriggers[1], 'Utrzymanie wagi');
        fireEvent.press(getByText('Zarejestruj się'));

        expect(registerUser).toHaveBeenCalledTimes(1);
        expect(registerUser).toHaveBeenCalledWith(
            expect.objectContaining({
                login: 'janusz',
                password: 'haslo123',
                weight: '90',
                dateOfBirth: expect.stringMatching(/2000/),
                plec: 'Mężczyzna',
                cel: 'Utrzymanie wagi'
            }),
            true,
            expect.any(Function),
            expect.any(Function),
            mockNavigation
        );
    });
});