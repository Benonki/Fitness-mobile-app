import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfilScreen from '../../src/screens/Profil';
import { UserContext } from '../../src/context/UserContext';
import * as AccountsApi from '../../src/api/accounts';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

jest.mock('../../src/api/accounts', () => ({
    getUserData: jest.fn(),
    updateUserData: jest.fn(),
}));

jest.mock('../../src/api/auth', () => ({
    handleLogout: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-file-system', () => ({
    readAsStringAsync: jest.fn(),
    EncodingType: { Base64: 'base64' },
}));

jest.mock('react-native-modal-datetime-picker', () => {
    const { View } = require('react-native');
    return (props) => <View testID="mock-date-picker" {...props} />;
});

jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const { View, Text } = require('react-native');

    const Picker = ({ children, selectedValue, onValueChange, ...props }) => {
        return (
            <View testID="mock-picker" {...props}>
                <Text testID="picker-value">{selectedValue}</Text>
                <Text
                    testID="trigger-change"
                    onPress={(newValue) => onValueChange(newValue)}>
                    Change
                </Text>
                {children}
            </View>
        );
    };

    Picker.Item = ({ label }) => <Text>{label}</Text>;
    return { Picker };
});

describe('ProfilScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
        reset: jest.fn(),
    };

    const mockUser = { id: 'user123' };
    const mockSetUser = jest.fn();

    const mockUserData = {
        name: 'Jan',
        lastName: 'Kowalski',
        weight: 80,
        height: 180,
        exercises: 3,
        stepsGoal: 5000,
        objective: 'Utrzymanie wagi',
        gender: 'Mężczyzna',
        dateOfBirth: '01.01.1990',
        imageUri: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        AccountsApi.getUserData.mockResolvedValue({ ...mockUserData });
        AccountsApi.updateUserData.mockImplementation((id, data) => Promise.resolve(data));

        ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
        ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });

        jest.spyOn(Alert, 'alert');
    });

    it('powinien załadować dane i wyświetlić domyślne zdjęcie (gdy imageUri jest null)', async () => {
        const { findByDisplayValue, UNSAFE_getByType } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        await findByDisplayValue('Jan');

        const { Image } = require('react-native');
        const imageComponent = UNSAFE_getByType(Image);
        expect(imageComponent).toBeTruthy();
    });

    it('powinien zablokować ujemną liczbę treningów', async () => {
        const { findByDisplayValue } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const exercisesInput = await findByDisplayValue('3');
        fireEvent.changeText(exercisesInput, '-5');

        expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Kroki i ilość treningów nie mogą być ujemne');
    });


    it('powinien poprawnie wybrać i przetworzyć zdjęcie', async () => {
        ImagePicker.launchImageLibraryAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file://test.jpg' }],
        });

        FileSystem.readAsStringAsync.mockResolvedValue('base64data');

        const { findByDisplayValue, getByText, UNSAFE_getByType } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        await findByDisplayValue('Jan');

        const { Image } = require('react-native');
        const imageElement = UNSAFE_getByType(Image);
        fireEvent.press(imageElement.parent);

        await waitFor(() => {
            expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file://test.jpg', expect.anything());
        });

        fireEvent.press(getByText('Zapisz zmiany'));

        await waitFor(() => {
            expect(AccountsApi.updateUserData).toHaveBeenCalledWith(
                'user123',
                expect.objectContaining({
                    imageUri: 'data:image/jpeg;base64,base64data'
                })
            );
        });
    });

    it('powinien zaktualizować datę urodzenia przez DatePicker', async () => {
        const { findByDisplayValue, getByTestId, getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        await findByDisplayValue('Jan');

        fireEvent.press(getByText('01.01.1990'));

        const datePicker = getByTestId('mock-date-picker');
        const newDate = new Date(2000, 4, 15);

        fireEvent(datePicker, 'onConfirm', newDate);

        fireEvent.press(getByText('Zapisz zmiany'));

        await waitFor(() => {
            expect(AccountsApi.updateUserData).toHaveBeenCalledWith(
                'user123',
                expect.objectContaining({
                    dateOfBirth: expect.stringMatching(/\d{1,2}\.\d{1,2}\.\d{4}/)
                })
            );
        });
    });

    it('powinien zmienić płeć', async () => {
        const { findByDisplayValue, getAllByTestId, getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        await findByDisplayValue('Jan');

        const pickers = getAllByTestId('trigger-change');
        const genderPickerTrigger = pickers[1];

        fireEvent.press(genderPickerTrigger, 'Kobieta');

        fireEvent.press(getByText('Zapisz zmiany'));

        await waitFor(() => {
            expect(AccountsApi.updateUserData).toHaveBeenCalledWith(
                'user123',
                expect.objectContaining({
                    gender: 'Kobieta'
                })
            );
        });
    });
-
    it('powinien wyświetlić Alert w przypadku błędu pobierania danych', async () => {
        AccountsApi.getUserData.mockRejectedValue(new Error('Fetch Error'));

        render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie udało się załadować danych użytkownika');
        });
    });

    it('nie powinien robić nic, jeśli użytkownik anuluje wybór zdjęcia', async () => {
        ImagePicker.launchImageLibraryAsync.mockResolvedValue({
            canceled: true,
            assets: null
        });

        const { findByDisplayValue, UNSAFE_getByType } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        await findByDisplayValue('Jan');

        const { Image } = require('react-native');
        const imageElement = UNSAFE_getByType(Image);

        fireEvent.press(imageElement.parent);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
    });

    it('powinien ustawić 0 przy wpisaniu nieprawidłowego tekstu (NaN) w polach liczbowych', async () => {
        const { findByDisplayValue, getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const weightInput = await findByDisplayValue('80');

        fireEvent.changeText(weightInput, 'invalid text');

        fireEvent.press(getByText('Zapisz zmiany'));

        await waitFor(() => {
            expect(AccountsApi.updateUserData).toHaveBeenCalledWith(
                'user123',
                expect.objectContaining({ weight: 0 })
            );
        });
    });

    it('powinien umożliwić wylogowanie, gdy dane się jeszcze nie załadowały', async () => {
        AccountsApi.getUserData.mockReturnValue(new Promise(() => {}));

        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        expect(getByText('Ładowanie danych...')).toBeTruthy();

        const logoutButton = getByText('Wyloguj się');
        fireEvent.press(logoutButton);

        const { handleLogout } = require('../../src/api/auth');

        expect(handleLogout).toHaveBeenCalled();
    });


    it('powinien przeliczyć BMI po zmianie WZROSTU', async () => {
        const { findByDisplayValue, getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const heightInput = await findByDisplayValue('180');

        expect(getByText('Waga prawidłowa', { exact: false })).toBeTruthy();

        fireEvent.changeText(heightInput, '160');

        expect(getByText('Otylość', { exact: false })).toBeTruthy();
    });

    it('powinien ustawić wartość na 0, gdy użytkownik wyczyści pole', async () => {
        const { findByDisplayValue, getByText } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProfilScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const stepsInput = await findByDisplayValue('5000');

        fireEvent.changeText(stepsInput, '');

        fireEvent.press(getByText('Zapisz zmiany'));

        await waitFor(() => {
            expect(AccountsApi.updateUserData).toHaveBeenCalledWith(
                'user123',
                expect.objectContaining({ stepsGoal: 0 })
            );
        });
    });
});