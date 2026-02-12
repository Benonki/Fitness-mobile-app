import React from 'react';
import { View, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DietaScreen from '../../src/screens/Dieta';
import { UserContext } from '../../src/context/UserContext';
import { StepContext } from '../../src/context/StepContext';
import { ProductContext } from '../../src/context/ProductContext';

jest.mock('react-native-circular-progress-indicator', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return ({ value, maxValue, title }) => (
        <View testID="mock-circular-progress">
            <Text>Value: {value}</Text>
            <Text>MaxValue: {maxValue}</Text>
            <Text>Title: {title}</Text>
        </View>
    );
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

jest.mock('expo-sensors', () => ({
    Pedometer: {
        isAvailableAsync: jest.fn(() => Promise.resolve(true)),
        getStepCountAsync: jest.fn(() => Promise.resolve({ steps: 5000 })),
        watchStepCount: jest.fn(() => {
            return { remove: jest.fn() };
        }),
    },
}));

describe('DietaScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    };

    const defaultUser = { stepsGoal: 6000 };
    const defaultStepContext = {
        stepCount: 0,
        pedometerAvailability: 'Available'
    };
    const defaultProductContext = {
        getTotalNutrients: jest.fn(() => ({ calories: 0 })),
        products: [],
        maxCalories: 2500
    };

    const renderWithContext = (
        userCtx = defaultUser,
        stepCtx = defaultStepContext,
        prodCtx = defaultProductContext
    ) => {
        return render(
            <UserContext.Provider value={{ user: userCtx }}>
                <StepContext.Provider value={stepCtx}>
                    <ProductContext.Provider value={prodCtx}>
                        <DietaScreen navigation={mockNavigation} />
                    </ProductContext.Provider>
                </StepContext.Provider>
            </UserContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien nawigować do "Dodane Produkty" po kliknięciu przycisku', () => {
        const { getByText } = renderWithContext();

        const button = getByText('Zobacz Dodane Produkty');
        fireEvent.press(button);

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Dodane Produkty');
    });

    it('powinien zaktualizować spożyte kalorie, gdy lista produktów się zmieni', async () => {
        const mockGetTotalNutrients = jest.fn()
            .mockReturnValueOnce({ calories: 0 })
            .mockReturnValueOnce({ calories: 500 });

        const { getByText, rerender } = render(
            <UserContext.Provider value={{ user: defaultUser }}>
                <StepContext.Provider value={defaultStepContext}>
                    <ProductContext.Provider value={{
                        getTotalNutrients: mockGetTotalNutrients,
                        products: [],
                        maxCalories: 2000
                    }}>
                        <DietaScreen navigation={mockNavigation} />
                    </ProductContext.Provider>
                </StepContext.Provider>
            </UserContext.Provider>
        );

        rerender(
            <UserContext.Provider value={{ user: defaultUser }}>
                <StepContext.Provider value={defaultStepContext}>
                    <ProductContext.Provider value={{
                        getTotalNutrients: mockGetTotalNutrients,
                        products: [{ name: 'Nowy Produkt' }],
                        maxCalories: 2000
                    }}>
                        <DietaScreen navigation={mockNavigation} />
                    </ProductContext.Provider>
                </StepContext.Provider>
            </UserContext.Provider>
        );

        await waitFor(() => {
            expect(getByText(/500 \/ 2000/)).toBeTruthy();
        });
    });
});