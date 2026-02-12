import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import InformacjeScreen from '../../src/screens/Informacje';
import { ProductContext } from '../../src/context/ProductContext';

jest.spyOn(Alert, 'alert');

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
    requestPermissionsAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    addNotificationReceivedListener: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
    removeNotificationSubscription: jest.fn(),
    AndroidImportance: {
        MAX: 5,
        HIGH: 4,
        DEFAULT: 3,
        LOW: 2,
        MIN: 1,
    },
}));

describe('InformacjeScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    };
    const mockAddProduct = jest.fn();

    const sampleProduct = {
        name: 'Test Product',
        nutriScore: 'a',
        calories: 100,
        fat: 10,
        sugar: 5,
        proteins: 20,
        image_url: 'http://test.com/image.jpg',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien wyświetlić komunikat o braku danych, jeśli productDetails jest pusty', () => {
        const { getByText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen route={{ params: {} }} navigation={mockNavigation} />
            </ProductContext.Provider>
        );

        expect(getByText('Brak danych o produkcie.')).toBeTruthy();
    });

    it('powinien zamknąć modal po kliknięciu przycisku "X"', () => {
        const { getByText, queryByText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen
                    route={{ params: { productDetails: sampleProduct } }}
                    navigation={mockNavigation}
                />
            </ProductContext.Provider>
        );

        fireEvent.press(getByText('+'));
        expect(getByText('Ile gramów zjadłeś?')).toBeTruthy();

        fireEvent.press(getByText('X'));
        expect(queryByText('Ile gramów zjadłeś?')).toBeNull();
    });

    it('powinien poprawnie przeliczyć wartości i dodać produkt (100g -> x1)', async () => {
        const { getByText, getByPlaceholderText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen
                    route={{ params: { productDetails: sampleProduct } }}
                    navigation={mockNavigation}
                />
            </ProductContext.Provider>
        );

        fireEvent.press(getByText('+'));
        fireEvent.changeText(getByPlaceholderText('Wprowadź liczbę gramów'), '100');
        fireEvent.press(getByText('Dodaj produkt'));

        expect(mockAddProduct).toHaveBeenCalledWith({
            name: 'Test Product',
            nutriScore: 'a',
            calories: '100.00',
            fat: '10.00',
            sugar: '5.00',
            proteins: '20.00',
            image_url: 'http://test.com/image.jpg',
        });

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Dodane Produkty');
    });

    it('powinien obsłużyć brakujące nutriScore', () => {
        const productNoScore = { ...sampleProduct, nutriScore: undefined };

        const { getByText, getByPlaceholderText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen
                    route={{ params: { productDetails: productNoScore } }}
                    navigation={mockNavigation}
                />
            </ProductContext.Provider>
        );

        fireEvent.press(getByText('+'));
        fireEvent.changeText(getByPlaceholderText('Wprowadź liczbę gramów'), '100');
        fireEvent.press(getByText('Dodaj produkt'));

        expect(mockAddProduct).toHaveBeenCalledWith(expect.objectContaining({
            nutriScore: 'default'
        }));
    });

    it('powinien wyświetlić tekst "Brak zdjęcia produktu", gdy image_url jest pusty', () => {
        const productNoImage = { ...sampleProduct, image_url: null };

        const { getByText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen
                    route={{ params: { productDetails: productNoImage } }}
                    navigation={mockNavigation}
                />
            </ProductContext.Provider>
        );

        expect(getByText('Brak zdjęcia produktu')).toBeTruthy();
    });

    it('powinien przekazać null dla wartości odżywczych, które nie są liczbami', async () => {
        const corruptProduct = {
            ...sampleProduct,
            calories: null,
            fat: 'nieznane',
            sugar: undefined,
            proteins: 20
        };

        const { getByText, getByPlaceholderText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen
                    route={{ params: { productDetails: corruptProduct } }}
                    navigation={mockNavigation}
                />
            </ProductContext.Provider>
        );

        fireEvent.press(getByText('+'));
        fireEvent.changeText(getByPlaceholderText('Wprowadź liczbę gramów'), '100');
        fireEvent.press(getByText('Dodaj produkt'));

        expect(mockAddProduct).toHaveBeenCalledWith(expect.objectContaining({
            calories: null,
            fat: null,
            sugar: null,
            proteins: '20.00'
        }));
    });

    it('powinien obsłużyć nutriScore przekazany jako tablica', async () => {
        const productWithArrayScore = { ...sampleProduct, nutriScore: ['E'] };

        const { getByText, getByPlaceholderText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen
                    route={{ params: { productDetails: productWithArrayScore } }}
                    navigation={mockNavigation}
                />
            </ProductContext.Provider>
        );

        fireEvent.press(getByText('+'));
        fireEvent.changeText(getByPlaceholderText('Wprowadź liczbę gramów'), '100');
        fireEvent.press(getByText('Dodaj produkt'));

        expect(mockAddProduct).toHaveBeenCalledWith(expect.objectContaining({
            nutriScore: ['E']
        }));
    });

    it('powinien użyć "default" dla pustej tablicy nutriScore', async () => {
        const productEmptyScore = { ...sampleProduct, nutriScore: [] };

        const { getByText, getByPlaceholderText } = render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                <InformacjeScreen
                    route={{ params: { productDetails: productEmptyScore } }}
                    navigation={mockNavigation}
                />
            </ProductContext.Provider>
        );

        fireEvent.press(getByText('+'));
        fireEvent.changeText(getByPlaceholderText('Wprowadź liczbę gramów'), '100');
        fireEvent.press(getByText('Dodaj produkt'));

        expect(mockAddProduct).toHaveBeenCalledWith(expect.objectContaining({
            nutriScore: []
        }));
    });
});