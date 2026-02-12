import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import WyszukiwarkaScreen from '../../src/screens/Wyszukiwarka';
import { UserContext } from '../../src/context/UserContext';
import * as ProductsApi from '../../src/api/products';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

jest.mock('../../assets/beep.mp3', () => 'mock-beep.mp3');

jest.mock('../../src/api/products', () => ({
    fetchSearchResultsFromAPI: jest.fn(),
    fetchDietProductsFromAPI: jest.fn(),
    fetchProductDataFromAPI: jest.fn(),
}));

jest.mock('expo-camera', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        Camera: {
            requestCameraPermissionsAsync: jest.fn(),
        },
        CameraView: ({ onBarcodeScanned, children, ...props }) => {
            return (
                <View testID="mock-camera-view" {...props}>
                    {children}
                    <View
                        testID="trigger-scan"
                        onTouchEnd={() => onBarcodeScanned && onBarcodeScanned({ data: '123456789' })}
                    />
                </View>
            );
        },
    };
});

jest.mock('expo-av', () => ({
    Audio: {
        Sound: {
            createAsync: jest.fn(() => Promise.resolve({ sound: { playAsync: jest.fn() } })),
        },
    },
}));

jest.mock('react-native-vector-icons/Ionicons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return (props) => <Text testID={`icon-${props.name}`}>{props.name}</Text>;
});

describe('WyszukiwarkaScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    };
    const mockUser = { id: 'user123', objective: 'Utrata wagi' };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        ProductsApi.fetchSearchResultsFromAPI.mockResolvedValue([]);
        ProductsApi.fetchDietProductsFromAPI.mockResolvedValue([]);

        jest.spyOn(console, 'error').mockImplementation(() => {});
        global.alert = jest.fn();
        jest.spyOn(Alert, 'alert');
    });

    afterEach(() => {
        jest.useRealTimers();
        console.error.mockRestore && console.error.mockRestore();
        global.alert.mockReset();
    });

    it('powinien załadować produkty dietetyczne na starcie', async () => {
        const dietProducts = [{ code: '1', product_name: 'Diet Apple', nutriments: {} }];
        ProductsApi.fetchDietProductsFromAPI.mockResolvedValue(dietProducts);

        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        await waitFor(() => {
            expect(ProductsApi.fetchDietProductsFromAPI).toHaveBeenCalledWith('Utrata wagi');
        });

        expect(getByText('Diet Apple')).toBeTruthy();
        expect(getByText('Propozycje dla celu: Utrata wagi')).toBeTruthy();
    });

    it('powinien nawigować do szczegółów produktu po kliknięciu w wynik wyszukiwania', async () => {
        const searchResults = [
            {
                code: '2',
                product_name: 'Banana',
                nutrition_grades_tags: ['a'],
                nutriments: { 'energy-kcal_100g': 89 }
            }
        ];
        ProductsApi.fetchSearchResultsFromAPI.mockResolvedValue(searchResults);

        const { getByPlaceholderText, getByText } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const input = getByPlaceholderText('Wyszukaj produkt');
        fireEvent.changeText(input, 'Banana');

        act(() => { jest.advanceTimersByTime(1000); });

        await waitFor(() => expect(getByText('Banana')).toBeTruthy());

        fireEvent.press(getByText('Banana'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Informacje o Produkcie', {
            productDetails: expect.objectContaining({
                name: 'Banana',
                calories: 89,
                nutriScore: ['a']
            })
        });
    });

    it('powinien poprosić o uprawnienia i otworzyć kamerę po kliknięciu ikony', async () => {
        Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const cameraIcon = getByTestId('icon-camera-outline');
        fireEvent.press(cameraIcon);

        await waitFor(() => {
            expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
            expect(getByTestId('mock-camera-view')).toBeTruthy();
        });
    });

    it('powinien wyświetlić Alert, jeśli brak uprawnień do kamery', async () => {
        Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });

        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        fireEvent.press(getByTestId('icon-camera-outline'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Brak dostępu', expect.stringContaining('musisz udzielić dostępu'));
        });
    });

    it('powinien obsłużyć zeskanowanie kodu kreskowego', async () => {
        Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

        const scannedProduct = {
            product_name: 'Scanned Milk',
            nutriments: { 'energy-kcal_100g': 50 }
        };
        ProductsApi.fetchProductDataFromAPI.mockResolvedValue(scannedProduct);

        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        fireEvent.press(getByTestId('icon-camera-outline'));
        await waitFor(() => expect(getByTestId('mock-camera-view')).toBeTruthy());

        const triggerScan = getByTestId('trigger-scan');
        fireEvent(triggerScan, 'touchEnd');

        await waitFor(() => {
            expect(Audio.Sound.createAsync).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(ProductsApi.fetchProductDataFromAPI).toHaveBeenCalledWith('123456789');
        });

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Informacje o Produkcie', expect.anything());
    });

    it('powinien wyświetlić Alert, jeśli zeskanowany produkt nie istnieje', async () => {
        Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
        ProductsApi.fetchProductDataFromAPI.mockResolvedValue(null);

        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        fireEvent.press(getByTestId('icon-camera-outline'));
        await waitFor(() => getByTestId('mock-camera-view'));

        fireEvent(getByTestId('trigger-scan'), 'touchEnd');

        await waitFor(() => {
            expect(ProductsApi.fetchProductDataFromAPI).toHaveBeenCalled();
        });

        expect(global.alert).toHaveBeenCalledWith('Nie znaleziono produktu');
    });

    it('powinien zamknąć kamerę po kliknięciu przycisku zamknięcia', async () => {
        Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

        const { getByTestId, queryByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        fireEvent.press(getByTestId('icon-camera-outline'));
        await waitFor(() => getByTestId('mock-camera-view'));

        const closeIcon = getByTestId('icon-close');
        fireEvent.press(closeIcon);

        expect(queryByTestId('mock-camera-view')).toBeNull();
    });

    it('powinien nawigować do "Dodane Produkty" po kliknięciu przycisku jabłka', () => {
        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <WyszukiwarkaScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const appleBtn = getByTestId('icon-nutrition-outline');
        fireEvent.press(appleBtn);

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Dodane Produkty');
    });
});