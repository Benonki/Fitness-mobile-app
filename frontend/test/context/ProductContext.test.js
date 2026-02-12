import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProductProvider, ProductContext } from '../../src/context/ProductContext';
import { UserContext } from '../../src/context/UserContext';
import * as EatedProductsApi from '../../src/api/eatedProducts';
import * as NotificationsApi from '../../src/api/notifications';

jest.mock('../../src/api/eatedProducts', () => ({
    loadProductsFromAPI: jest.fn(),
    updateUserProducts: jest.fn(),
}));

jest.mock('../../src/api/notifications', () => ({
    setNotificationFlag: jest.fn(),
}));

jest.mock('../../src/context/NotificationContext', () => ({
    useNotifications: () => ({
        addUserNotification: jest.fn(),
    }),
}));

const TestConsumer = () => {
    const { products, addProduct, removeProduct, maxCalories, getTotalNutrients } = useContext(ProductContext);
    const totals = getTotalNutrients();

    return (
        <View>
            <Text testID="product-count">{products.length}</Text>
            <Text testID="max-calories">{maxCalories}</Text>
            <Text testID="total-fat">{totals.fat}</Text>

            <Button
                title="Dodaj Częściowy"
                onPress={() => addProduct({ name: 'Chleb', calories: 100 })}
            />
            <Button
                title="Dodaj Zero Kalorii"
                onPress={() => addProduct({ name: 'Woda', calories: 0 })}
            />
            <Button
                title="Usuń Produkt"
                onPress={() => removeProduct(0)}
            />
        </View>
    );
};

describe('ProductContext', () => {
    const mockUser = {
        id: 'user123',
        weight: 80,
        height: 180,
        dateOfBirth: '01.01.1990',
        gender: 'Mężczyzna',
        exercises: 3,
        objective: 'Utrzymanie wagi',
        eatenProducts: [],
        notificationFlags: {}
    };

    const mockSetUser = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien obsłużyć błąd podczas wysyłania powiadomienia o celu kalorii', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const userOverLimit = {
            ...mockUser,
            notificationFlags: { caloriesGoalSent: false }
        };

        EatedProductsApi.loadProductsFromAPI.mockResolvedValue({
            eatenProducts: [{ name: 'Pizza', calories: 5000 }]
        });

        NotificationsApi.setNotificationFlag.mockRejectedValue(new Error('Flag Error'));

        render(
            <UserContext.Provider value={{ user: userOverLimit, setUser: mockSetUser }}>
                <ProductProvider>
                    <TestConsumer />
                </ProductProvider>
            </UserContext.Provider>
        );

        await waitFor(() => {
            expect(NotificationsApi.setNotificationFlag).toHaveBeenCalled();
        });

        expect(consoleSpy).toHaveBeenCalledWith('Błąd podczas wysyłania powiadomienia o celu kalorii:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('nie powinien dodać produktu z 0 kalorii', async () => {
        EatedProductsApi.loadProductsFromAPI.mockResolvedValue({ eatenProducts: [] });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { getByText, getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProductProvider>
                    <TestConsumer />
                </ProductProvider>
            </UserContext.Provider>
        );

        await waitFor(() => expect(getByTestId('product-count').children[0]).toBe('0'));

        fireEvent.press(getByText('Dodaj Zero Kalorii'));

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(getByTestId('product-count').children[0]).toBe('0');
        expect(EatedProductsApi.updateUserProducts).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('powinien obsłużyć błąd podczas usuwania produktu', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        EatedProductsApi.loadProductsFromAPI.mockResolvedValue({
            eatenProducts: [{ name: 'Chleb', calories: 100 }]
        });

        EatedProductsApi.updateUserProducts.mockRejectedValue(new Error('Delete Error'));

        const { getByText, getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProductProvider>
                    <TestConsumer />
                </ProductProvider>
            </UserContext.Provider>
        );

        await waitFor(() => expect(getByTestId('product-count').children[0]).toBe('1'));

        fireEvent.press(getByText('Usuń Produkt'));

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(getByTestId('product-count').children[0]).toBe('1');
        expect(consoleSpy).toHaveBeenCalledWith('Błąd podczas usuwania produktu:', expect.any(Error));

        consoleSpy.mockRestore();
    });

    it('powinien zainicjować nową tablicę produktów, gdy API zwróci brak historii', async () => {
        EatedProductsApi.loadProductsFromAPI.mockResolvedValue({});
        EatedProductsApi.updateUserProducts.mockResolvedValue({});

        const { getByText, getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser, setUser: mockSetUser }}>
                <ProductProvider>
                    <TestConsumer />
                </ProductProvider>
            </UserContext.Provider>
        );

        await waitFor(() => expect(getByTestId('product-count').children[0]).toBe('0'));

        fireEvent.press(getByText('Dodaj Częściowy'));

        await waitFor(() => {
            expect(getByTestId('product-count').children[0]).toBe('1');
        });

        expect(EatedProductsApi.updateUserProducts).toHaveBeenCalledWith(
            'user123',
            expect.any(Array)
        );

        const callArgs = EatedProductsApi.updateUserProducts.mock.calls[0][1];
        expect(callArgs).toHaveLength(1);
        expect(callArgs[0].name).toBe('Chleb');
    });

    describe('Obliczanie MaxCalories', () => {
        const renderWithUser = async (customUser) => {
            EatedProductsApi.loadProductsFromAPI.mockResolvedValue({ eatenProducts: [] });
            const { getByTestId } = render(
                <UserContext.Provider value={{ user: { ...mockUser, ...customUser }, setUser: mockSetUser }}>
                    <ProductProvider>
                        <TestConsumer />
                    </ProductProvider>
                </UserContext.Provider>
            );
            await waitFor(() => getByTestId('max-calories'));
            return getByTestId('max-calories').children[0];
        };

        it('przypadek: Kobieta, Exercises 0', async () => {
            const result = await renderWithUser({
                gender: 'Kobieta', weight: 60, height: 170, dateOfBirth: '01.01.1995', exercises: 0
            });
            expect(parseInt(result)).toBeGreaterThan(0);
        });

        it('przypadek: Cel - Utrata wagi', async () => {
            const result = await renderWithUser({ objective: 'Utrata wagi' });
            expect(parseInt(result)).toBeGreaterThan(0);
        });

        it('przypadek: Cel - Przybieranie na wadze', async () => {
            const result = await renderWithUser({ objective: 'Przybieranie na wadze' });
            expect(parseInt(result)).toBeGreaterThan(0);
        });

        it('przypadek: Brak user data (return 0)', async () => {
            const { getByTestId } = render(
                <UserContext.Provider value={{ user: null, setUser: mockSetUser }}>
                    <ProductProvider>
                        <TestConsumer />
                    </ProductProvider>
                </UserContext.Provider>
            );
            expect(getByTestId('max-calories').children[0]).toBe('0');
        });
        describe('Obliczanie MaxCalories - zakresy oraz wartości domyślne', () => {
            const renderWithUser = async (customUser) => {
                EatedProductsApi.loadProductsFromAPI.mockResolvedValue({ eatenProducts: [] });
                const { getByTestId } = render(
                    <UserContext.Provider value={{ user: { ...mockUser, ...customUser }, setUser: mockSetUser }}>
                        <ProductProvider>
                            <TestConsumer />
                        </ProductProvider>
                    </UserContext.Provider>
                );
                await waitFor(() => getByTestId('max-calories'));
                return getByTestId('max-calories').children[0];
            };

            it('powinien użyć domyślnego mnożnika gdy liczba treningów wykracza poza zakres (np. 10)', async () => {
                const result = await renderWithUser({ exercises: 10 });
                const val = parseInt(result);
                expect(val).toBeGreaterThan(3600);
            });

            it('powinien zwrócić domyślne 2000 kcal, gdy cel jest nieznany/inny', async () => {
                const result = await renderWithUser({ objective: 'Budowanie siły' });
                expect(result).toBe('2000');
            });
        });
    });
});