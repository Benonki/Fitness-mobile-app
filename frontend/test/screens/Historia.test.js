import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HistoriaScreen from '../../src/screens/Historia';
import { UserContext } from '../../src/context/UserContext';

jest.mock('react-native-chart-kit', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        LineChart: (props) => <View testID="mock-line-chart" {...props} />
    };
});

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        MaterialIcons: ({ name }) => <Text testID={`icon-${name}`}>{name}</Text>
    };
});

jest.mock("react-native-modal-datetime-picker", () => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');

    return ({ isVisible, onConfirm, onCancel }) => {
        if (!isVisible) return null;
        return (
            <View testID="mock-date-picker">
                <TouchableOpacity
                    testID="confirm-date-btn"
                    onPress={() => onConfirm(new Date('2023-01-02T12:00:00'))}
                >
                    <Text>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="cancel-date-btn" onPress={onCancel}>
                    <Text>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
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
                    Change
                </Text>
                {children}
            </View>
        );
    };
    Picker.Item = ({ label }) => <Text>{label}</Text>;
    return { Picker };
});

describe('HistoriaScreen', () => {
    const mockUserWithHistory = {
        id: 'user123',
        history: [
            {
                date: '2023-01-01',
                weight: 80,
                height: 180,
                sumOfCalories: 2000,
                numberOfSteps: 5000,
                numberOfExercises: 1
            },
            {
                date: '2023-01-02',
                weight: 79.5,
                height: 180,
                sumOfCalories: 2200,
                numberOfSteps: 8000,
                numberOfExercises: 2
            },
            {
                date: '2023-01-03',
                weight: 79.0,
                height: 180,
                sumOfCalories: 1800,
                numberOfSteps: 3000,
                numberOfExercises: 0
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert');

        jest.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function() {
            const day = this.getDate().toString().padStart(2, '0');
            const month = (this.getMonth() + 1).toString().padStart(2, '0');
            const year = this.getFullYear();
            return `${day}.${month}.${year}`;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('powinien wyświetlić komunikat o braku historii, gdy user.history jest puste', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: { history: [] } }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        expect(getByText('Brak historii')).toBeTruthy();
        expect(getByText('Twoja historia danych będzie dostępna po pierwszym resecie dziennym.', { exact: false })).toBeTruthy();
    });

    it('powinien domyślnie wyświetlić tryb Dzienny i dane z ostatniego dnia', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUserWithHistory }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        expect(getByText('Wybierz dzień')).toBeTruthy();
        expect(getByText('Dane z dnia 03.01.2023')).toBeTruthy();

        expect(getByText('79 kg')).toBeTruthy();
        expect(getByText('1800 kcal')).toBeTruthy();
        expect(getByText('3000')).toBeTruthy();
    });

    it('powinien przełączyć się na tryb Okres po kliknięciu przycisku', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUserWithHistory }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        const periodButton = getByText('Okres');
        fireEvent.press(periodButton);

        expect(getByText('Wybierz okres')).toBeTruthy();
        expect(getByText('Typ wykresu')).toBeTruthy();
    });

    it('powinien obsłużyć wybór daty początkowej i końcowej oraz wyświetlić wykres', async () => {
        const { getByText, getAllByText, getByTestId } = render(
            <UserContext.Provider value={{ user: mockUserWithHistory }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        fireEvent.press(getByText('Okres'));

        const dateInputs = getAllByText('Wybierz datę');
        fireEvent.press(dateInputs[0]);
        fireEvent.press(getByTestId('confirm-date-btn'));

        fireEvent.press(getByText('Wybierz datę'));
        fireEvent.press(getByTestId('confirm-date-btn'));

        expect(getByTestId('mock-line-chart')).toBeTruthy();
        expect(getByText('Waga (kg)')).toBeTruthy();
    });

    it('powinien zmienić typ wykresu na "Ilość Kroków" i zaktualizować tytuł', async () => {
        const { getByText, getAllByText, getAllByTestId, getByTestId } = render(
            <UserContext.Provider value={{ user: mockUserWithHistory }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        fireEvent.press(getByText('Okres'));

        const dateInputs = getAllByText('Wybierz datę');
        fireEvent.press(dateInputs[0]);
        fireEvent.press(getByTestId('confirm-date-btn'));
        fireEvent.press(getByText('Wybierz datę'));
        fireEvent.press(getByTestId('confirm-date-btn'));

        expect(getByText('Waga (kg)')).toBeTruthy();

        const triggerChange = getAllByTestId('trigger-picker-change')[0];
        fireEvent.press(triggerChange, 'numberOfSteps');

        const stepsTexts = getAllByText('Ilość Kroków');
        expect(stepsTexts.length).toBeGreaterThan(0);
    });

    it('powinien wyświetlić komunikat "Brak danych dla wybranego okresu", jeśli filtr nie zwróci wyników', () => {
        const userNoMatchingData = {
            id: 'u1',
            history: [
                { date: '2020-01-01', weight: 80 }
            ]
        };

        const { getByText, getAllByText, getByTestId } = render(
            <UserContext.Provider value={{ user: userNoMatchingData }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        fireEvent.press(getByText('Okres'));

        const dateInputs = getAllByText('Wybierz datę');
        fireEvent.press(dateInputs[0]);
        fireEvent.press(getByTestId('confirm-date-btn'));
        fireEvent.press(getByText('Wybierz datę'));
        fireEvent.press(getByTestId('confirm-date-btn'));

        expect(getByText('Brak danych dla wybranego okresu')).toBeTruthy();
    });

    it('powinien zaktualizować wyświetlane dane po zmianie daty w trybie Dziennym', () => {
        const { getByText, getAllByTestId } = render(
            <UserContext.Provider value={{ user: mockUserWithHistory }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        expect(getByText('Dane z dnia 03.01.2023')).toBeTruthy();
        expect(getByText('79 kg')).toBeTruthy();

        const pickers = getAllByTestId('trigger-picker-change');
        const datePickerTrigger = pickers[0];

        fireEvent.press(datePickerTrigger, '01.01.2023');
        expect(getByText('Dane z dnia 01.01.2023')).toBeTruthy();
        expect(getByText('80 kg')).toBeTruthy();
    });

    it('powinien wyświetlić błąd walidacji, gdy data początkowa jest późniejsza od końcowej', () => {
        const { getByText, getAllByText, getByTestId, queryByTestId } = render(
            <UserContext.Provider value={{ user: mockUserWithHistory }}>
                <HistoriaScreen />
            </UserContext.Provider>
        );

        fireEvent.press(getByText('Okres'));
        const dateInputs = getAllByText('Wybierz datę');
        fireEvent.press(dateInputs[1]);
        fireEvent.press(getByTestId('confirm-date-btn'));
        fireEvent.press(getByText('Wybierz datę'));
        fireEvent.press(getByTestId('confirm-date-btn'));

        expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Data początkowa nie może być późniejsza niż data końcowa');
        expect(queryByTestId('mock-line-chart')).toBeNull();
    });
});