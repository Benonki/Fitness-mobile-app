import React, { useContext, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { UserProvider, UserContext } from '../../src/context/UserContext';
import { ProductProvider, ProductContext } from '../../src/context/ProductContext';

jest.mock('../../src/context/NotificationContext', () => ({
    NotificationsProvider: ({ children }) => children,
    useNotifications: () => ({
        addUserNotification: jest.fn(),
    }),
}));

jest.mock('../../src/context/StepContext', () => ({ StepProvider: ({ children }) => children }));

import * as AccountsApi from '../../src/api/accounts';
import * as EatedProductsApi from '../../src/api/eatedProducts';

jest.mock('../../src/api/accounts');
jest.mock('../../src/api/eatedProducts');
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

const MockProfileScreen = () => {
    const { user, setUser } = useContext(UserContext);
    const { maxCalories } = useContext(ProductContext);

    const handleChangeWeight = async () => {
        const updatedUser = { ...user, weight: 90 };
        await AccountsApi.updateUserData(user.id, { weight: 90 });
        setUser(updatedUser);
    };

    if (!user) return null;

    return (
        <View>
            <Text>Aktualna waga: {user.weight} kg</Text>
            <Text>Zapotrzebowanie: {maxCalories} kcal</Text>
            <Button title="Zmień wagę na 90kg" onPress={handleChangeWeight} />
        </View>
    );
};

const UserInitializer = () => {
    const { setUser } = useContext(UserContext);
    useEffect(() => {
        setUser({
            id: 'u1',
            login: 'gymrat',
            weight: 80,
            height: 180,
            dateOfBirth: '01.01.1990',
            gender: 'Mężczyzna',
            exercises: 3,
            objective: 'Utrzymanie wagi',
            eatenProducts: [],
            notificationFlags: {}
        });
    }, []);
    return null;
};

const IntegrationApp = () => (
    <UserProvider>
        <ProductProvider>
            <UserInitializer />
            <MockProfileScreen />
        </ProductProvider>
    </UserProvider>
);

describe('Proces aktulizacji profilu oraz przeliczania kalorii', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        EatedProductsApi.loadProductsFromAPI.mockResolvedValue({ eatenProducts: [] });
        AccountsApi.updateUserData.mockResolvedValue({});
    });

    it('powinien przeliczyć maxCalories po zmianie wagi użytkownika', async () => {
        const { getByText } = render(<IntegrationApp />);

        await waitFor(() => expect(getByText('Aktualna waga: 80 kg')).toBeTruthy());

        const initialCaloriesText = getByText(/Zapotrzebowanie:/).props.children.join('');
        const initialCalories = parseInt(initialCaloriesText.replace(/[^0-9]/g, ''));

        expect(initialCalories).toBeGreaterThan(0);

        fireEvent.press(getByText('Zmień wagę na 90kg'));

        await waitFor(() => {
            expect(AccountsApi.updateUserData).toHaveBeenCalledWith('u1', { weight: 90 });
        });

        await waitFor(() => {
            expect(getByText('Aktualna waga: 90 kg')).toBeTruthy();
        });

        const newCaloriesText = getByText(/Zapotrzebowanie:/).props.children.join('');
        const newCalories = parseInt(newCaloriesText.replace(/[^0-9]/g, ''));

        expect(newCalories).toBeGreaterThan(initialCalories);
    });
});