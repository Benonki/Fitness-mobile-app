import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DodaneProduktyScreen from '../../src/screens/DodaneProdukty';
import { ProductContext } from '../../src/context/ProductContext';

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        AntDesign: ({ name, onPress }) => (
            <Text testID={`icon-${name}`} onPress={onPress}>{name}</Text>
        ),
    };
});

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('../../src/screens/DodaneProdukty/nonScannableProducts.json', () => ({
    nonScannableProducts: [
        { name: 'Jajecznica', calories: 150, fat: 10, sugar: 1, proteins: 12 },
        { name: 'Bułka', calories: 200, fat: 2, sugar: 5, proteins: 8 },
    ]
}), { virtual: true });

describe('DodaneProduktyScreen', () => {
    const mockAddProduct = jest.fn();
    const mockRemoveProduct = jest.fn();
    const mockGetTotalNutrients = jest.fn(() => ({
        calories: 500,
        fat: 20,
        sugar: 10,
        proteins: 30
    }));

    const mockProducts = [
        { name: 'Jabłko', calories: 50, fat: 0.2, sugar: 10, proteins: 0.5 },
        { name: 'Chleb', calories: 250, fat: 2, sugar: 1, proteins: 8 }
    ];

    const renderWithContext = (products = mockProducts) => {
        return render(
            <ProductContext.Provider value={{
                products: products,
                getTotalNutrients: mockGetTotalNutrients,
                removeProduct: mockRemoveProduct,
                addProduct: mockAddProduct,
                lastDate: '2023-01-01'
            }}>
                <DodaneProduktyScreen />
            </ProductContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert');
    });

    it('powinien wyrenderować listę dodanych produktów i sumy makroskładników', () => {
        const { getByText } = renderWithContext();

        expect(getByText('Dzisiejsza data: 2023-01-01')).toBeTruthy();

        expect(getByText('Jabłko')).toBeTruthy();
        expect(getByText('Chleb')).toBeTruthy();

        expect(getByText('Łączne Kalorie: 500.00')).toBeTruthy();
        expect(getByText('Tłuszcz: 20.00g')).toBeTruthy();
    });

    it('powinien usunąć produkt po kliknięciu ikony minusa', () => {
        const { getAllByTestId } = renderWithContext();

        const deleteButtons = getAllByTestId('icon-minuscircleo');

        fireEvent.press(deleteButtons[0]);

        expect(mockRemoveProduct).toHaveBeenCalledWith(0);
    });

    it('powinien otworzyć modal i przełączać zakładki', () => {
        const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderWithContext();

        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        expect(getByText('Dodaj produkt')).toBeTruthy();

        expect(getByText('LISTA  PRODUKTÓW')).toBeTruthy();
        expect(getByPlaceholderText('Ile sztuk zjadłeś?')).toBeTruthy();

        fireEvent.press(getByText('PRODUKT NIESTANDARDOWY'));

        expect(getByPlaceholderText('Nazwa produktu')).toBeTruthy();
        expect(queryByPlaceholderText('Ile sztuk zjadłeś?')).toBeNull();
    });

    it('powinien dodać produkt z listy predefiniowanej', () => {
        const { getByText, getByPlaceholderText } = renderWithContext();

        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('Jajecznica'));

        const qtyInput = getByPlaceholderText('Ile sztuk zjadłeś?');
        fireEvent.changeText(qtyInput, '2');
        fireEvent.press(getByText('Dodaj'));
        expect(mockAddProduct).toHaveBeenCalledWith({
            name: 'Jajecznica (2x)',
            calories: 300,
            fat: 20,
            sugar: 2,
            proteins: 24
        });
    });

    it('powinien wyświetlić błąd, jeśli nie wybrano produktu z listy', () => {
        const { getByText } = renderWithContext();
        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('Dodaj'));

        expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Wybierz produkt z listy.');
        expect(mockAddProduct).not.toHaveBeenCalled();
    });

    it('powinien dodać produkt niestandardowy', () => {
        const { getByText, getByPlaceholderText } = renderWithContext();

        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('PRODUKT NIESTANDARDOWY'));

        fireEvent.changeText(getByPlaceholderText('Nazwa produktu'), 'Obiad');
        fireEvent.changeText(getByPlaceholderText('Kalorie'), '400');
        fireEvent.changeText(getByPlaceholderText('Tłuszcz (opcjonalnie)'), '10');
        fireEvent.changeText(getByPlaceholderText('Cukry (opcjonalnie)'), '5');
        fireEvent.changeText(getByPlaceholderText('Białko (opcjonalnie)'), '20');

        fireEvent.press(getByText('CAŁOŚĆ'));
        fireEvent.press(getByText('Dodaj'));

        expect(mockAddProduct).toHaveBeenCalledWith({
            name: 'Obiad',
            calories: 400,
            fat: 10,
            sugar: 5,
            proteins: 20
        });
    });

    it('powinien dodać produkt niestandardowy (na 100G) i przeliczyć wartości', () => {
        const { getByText, getByPlaceholderText } = renderWithContext();

        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('PRODUKT NIESTANDARDOWY'));

        fireEvent.changeText(getByPlaceholderText('Nazwa produktu'), 'Ryż');
        fireEvent.changeText(getByPlaceholderText('Kalorie'), '200');
        fireEvent.changeText(getByPlaceholderText('Tłuszcz (opcjonalnie)'), '1');

        fireEvent.press(getByText('100G'));

        const weightInput = getByPlaceholderText('Ile gramów zjadłeś?');
        fireEvent.changeText(weightInput, '200');
        fireEvent.press(getByText('Dodaj'));
        expect(mockAddProduct).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Ryż',
            calories: 400,
            fat: 2
        }));
    });

    it('powinien wyświetlić błąd, gdy nazwa produktu jest pusta', () => {
        const { getByText, getByPlaceholderText } = renderWithContext();
        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('PRODUKT NIESTANDARDOWY'));

        fireEvent.changeText(getByPlaceholderText('Kalorie'), '100');
        fireEvent.press(getByText('Dodaj'));

        expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nazwa produktu jest wymagana.');
    });

    it('powinien wyświetlić błąd, gdy makroskładniki są ujemne', () => {
        const { getByText, getByPlaceholderText } = renderWithContext();
        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('PRODUKT NIESTANDARDOWY'));

        fireEvent.changeText(getByPlaceholderText('Nazwa produktu'), 'Coś');
        fireEvent.changeText(getByPlaceholderText('Kalorie'), '100');
        fireEvent.changeText(getByPlaceholderText('Tłuszcz (opcjonalnie)'), '-5');

        fireEvent.press(getByText('Dodaj'));
        expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Tłuszcz nie może mieć wartości ujemnej.');
    });

    it('powinien wyświetlić błąd, jeśli nie wybrano trybu (100G/CAŁOŚĆ)', () => {
        const { getByText, getByPlaceholderText } = renderWithContext();
        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('PRODUKT NIESTANDARDOWY'));

        fireEvent.changeText(getByPlaceholderText('Nazwa produktu'), 'Coś');
        fireEvent.changeText(getByPlaceholderText('Kalorie'), '100');
        fireEvent.press(getByText('Dodaj'));

        expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Wybierz, czy podano wartości dla 100g czy całego produktu.');
    });

    it('powinien wyświetlić błąd, jeśli wybrano 100G ale nie podano wagi', () => {
        const { getByText, getByPlaceholderText } = renderWithContext();
        fireEvent.press(getByText('Dodaj produkt nieskanowalny'));
        fireEvent.press(getByText('PRODUKT NIESTANDARDOWY'));

        fireEvent.changeText(getByPlaceholderText('Nazwa produktu'), 'Coś');
        fireEvent.changeText(getByPlaceholderText('Kalorie'), '100');

        fireEvent.press(getByText('100G'));

        fireEvent.press(getByText('Dodaj'));
        expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Podaj ilość gramów, którą zjadłeś.');
    });

});