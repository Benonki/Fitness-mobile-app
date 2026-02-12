import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import InformacjeScreen from '../../src/screens/Informacje';
import DietaScreen from '../../src/screens/Dieta';

import { UserProvider, UserContext } from '../../src/context/UserContext';
import { ProductProvider } from '../../src/context/ProductContext';
import { StepProvider } from '../../src/context/StepContext';
import { NotificationsProvider } from '../../src/context/NotificationContext';

import * as EatedProductsApi from '../../src/api/eatedProducts';
import * as StepsApi from '../../src/api/steps';
import * as NotificationsApi from '../../src/api/notifications';

jest.mock('../../src/api/eatedProducts');
jest.mock('../../src/api/steps');
jest.mock('../../src/api/notifications');

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('expo-sensors', () => ({
    Pedometer: {
        isAvailableAsync: jest.fn(() => Promise.resolve(true)),
        watchStepCount: jest.fn(() => ({ remove: jest.fn() })),
        getStepCountAsync: jest.fn(() => Promise.resolve({ steps: 0 }))
    }
}));
jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('react-native-circular-progress-indicator', () => {
    const { Text, View } = require('react-native');
    return ({ value, maxValue }) => <View><Text>Progress: {value}/{maxValue}</Text></View>;
});
jest.mock('react-native-chart-kit', () => ({ LineChart: () => null }));
jest.mock('react-native-modal-datetime-picker', () => () => null);

const UserInitializer = ({ onUserReady }) => {
    const { setUser } = useContext(UserContext);

    useEffect(() => {
        const mockUser = {
            id: 'test-user-id',
            login: 'janusz',
            weight: 80,
            height: 180,
            stepsGoal: 6000,
            exercises: 0,
            gender: 'Mężczyzna',
            dateOfBirth: '01.01.1990',
            objective: 'Utrzymanie wagi',
            eatenProducts: [],
            notificationFlags: {}
        };
        setUser(mockUser);
        onUserReady();
    }, []);

    return null;
};

const IntegrationApp = () => {
    const [currentScreen, setCurrentScreen] = useState('Informacje');
    const [isUserReady, setIsUserReady] = useState(false);

    const navigationMock = {
        navigate: (screenName) => setCurrentScreen(screenName),
        goBack: jest.fn(),
    };

    const productData = {
        name: 'Banan Testowy',
        calories: 90,
        fat: 0.3,
        sugar: 12,
        proteins: 1.1,
        image_url: 'http://fake.url/banana.jpg',
        nutriScore: 'a'
    };

    return (
        <UserProvider>
            <NotificationsProvider>
                <StepProvider>
                    <ProductProvider>
                        <UserInitializer onUserReady={() => setIsUserReady(true)} />
                        {isUserReady && (
                            <View style={{ flex: 1 }}>
                                {currentScreen === 'Informacje' && (
                                    <InformacjeScreen
                                        navigation={navigationMock}
                                        route={{ params: { productDetails: productData } }}
                                    />
                                )}
                                {currentScreen === 'Dodane Produkty' && (
                                    <View>
                                        <Text>Ekran: Dodane Produkty</Text>
                                        <Button
                                            title="Przejdź do Diety"
                                            onPress={() => setCurrentScreen('Dieta')}
                                        />
                                    </View>
                                )}
                                {currentScreen === 'Dieta' && (
                                    <DietaScreen navigation={navigationMock} />
                                )}
                            </View>
                        )}
                    </ProductProvider>
                </StepProvider>
            </NotificationsProvider>
        </UserProvider>
    );
};

describe('Proces dodawania produktu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        EatedProductsApi.loadProductsFromAPI.mockResolvedValue({ eatenProducts: [] });
        EatedProductsApi.updateUserProducts.mockResolvedValue({});
        StepsApi.loadStepData.mockResolvedValue(0);
        NotificationsApi.loadNotifications.mockResolvedValue([]);
    });

    it('powinien dodać produkt, wywołać API i zaktualizować kalorie na ekranie Diety', async () => {
        const { getByText, getByPlaceholderText } = render(<IntegrationApp />);

        await waitFor(() => expect(getByText('Banan Testowy')).toBeTruthy());
        expect(getByText('90 kcal')).toBeTruthy();

        fireEvent.press(getByText('+'));

        const input = getByPlaceholderText('Wprowadź liczbę gramów');
        fireEvent.changeText(input, '200');

        fireEvent.press(getByText('Dodaj produkt'));

        await waitFor(() => {
            expect(EatedProductsApi.updateUserProducts).toHaveBeenCalledWith(
                'test-user-id',
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Banan Testowy',
                        calories: "180.00"
                    })
                ])
            );
        });

        expect(getByText('Ekran: Dodane Produkty')).toBeTruthy();

        fireEvent.press(getByText('Przejdź do Diety'));

        await waitFor(() => {
            expect(getByText(/180 \//)).toBeTruthy();
        });
    });
});