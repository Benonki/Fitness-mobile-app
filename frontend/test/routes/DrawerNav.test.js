import React from 'react';
import { render, waitFor, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';
import DrawerNav from '../../src/routes/DrawerNav';
import { UserContext } from '../../src/context/UserContext';
import { useNotifications } from '../../src/context/NotificationContext';

jest.mock('@react-navigation/drawer', () => {
    const React = require('react');
    const { View } = require('react-native');

    return {
        createDrawerNavigator: () => ({
            Navigator: ({ children, screenOptions }) => {
                const mockNavigation = { openDrawer: jest.fn() };

                const resolvedOptions = typeof screenOptions === 'function'
                    ? screenOptions({ navigation: mockNavigation })
                    : screenOptions;

                return (
                    <View testID="Drawer.Navigator">
                        {resolvedOptions?.headerBackground && (
                            <View testID="header-background">
                                {resolvedOptions.headerBackground()}
                            </View>
                        )}

                        {resolvedOptions?.headerLeft && (
                            <View testID="header-left-container">
                                {resolvedOptions.headerLeft()}
                            </View>
                        )}

                        {children}
                    </View>
                );
            },
            Screen: ({ name, options }) => {
                return (
                    <View testID={`Drawer.Screen.${name}`}>
                        {options?.drawerLabel && typeof options.drawerLabel === 'function'
                            ? options.drawerLabel({ color: 'black' })
                            : null
                        }

                        {options?.drawerIcon && (
                            <View testID={`icon-wrapper-${name}`}>
                                {options.drawerIcon({ color: 'black', size: 24 })}
                            </View>
                        )}
                    </View>
                );
            },
        }),
    };
});

jest.mock('../../src/context/NotificationContext', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('../../src/screens/EkranGlowny', () => () => null);
jest.mock('../../src/screens/Profil', () => () => null);
jest.mock('../../src/screens/Trening', () => () => null);
jest.mock('../../src/screens/Dieta', () => () => null);
jest.mock('../../src/screens/Wyszukiwarka', () => () => null);
jest.mock('../../src/screens/Powiadomienia', () => () => null);
jest.mock('../../src/screens/Historia', () => () => null);

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        Ionicons: ({ name }) => <Text testID={`icon-${name}`}>{name}</Text>,
        MaterialIcons: ({ name }) => <Text testID={`material-icon-${name}`}>MaterialIcon: {name}</Text>,
    };
});

jest.mock('expo-linear-gradient', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        LinearGradient: () => <View testID="mock-linear-gradient" />
    };
});

describe('DrawerNav', () => {
    const mockUser = { id: 'user123' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien przypisać poprawne ikony do poszczególnych ekranów', async () => {
        useNotifications.mockReturnValue({ notifications: { 'user123': [] } });

        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <NavigationContainer>
                    <DrawerNav />
                </NavigationContainer>
            </UserContext.Provider>
        );

        await waitFor(() => getByTestId('Drawer.Navigator'));

        const homeScreenIcon = within(getByTestId('Drawer.Screen.Ekran Główny')).getByTestId('material-icon-home');
        expect(homeScreenIcon).toBeTruthy();

        const treningScreenIcon = within(getByTestId('Drawer.Screen.Wybór Treningu')).getByTestId('material-icon-fitness-center');
        expect(treningScreenIcon).toBeTruthy();

        const dietaScreenIcon = within(getByTestId('Drawer.Screen.Śledzenie Diety')).getByTestId('material-icon-restaurant');
        expect(dietaScreenIcon).toBeTruthy();

        const profilScreenIcon = within(getByTestId('Drawer.Screen.Profil')).getByTestId('material-icon-person');
        expect(profilScreenIcon).toBeTruthy();
    });

    it('powinien wyrenderować Badge w nagłówku i menu, gdy są powiadomienia', async () => {
        useNotifications.mockReturnValue({
            notifications: { 'user123': [1, 2, 3] }
        });

        const { getByTestId } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <NavigationContainer>
                    <DrawerNav />
                </NavigationContainer>
            </UserContext.Provider>
        );

        await waitFor(() => getByTestId('Drawer.Navigator'));

        const headerContainer = getByTestId('header-left-container');
        expect(within(headerContainer).getByText('3')).toBeTruthy();

        const menuContainer = getByTestId('Drawer.Screen.Powiadomienia');
        expect(within(menuContainer).getByText('3')).toBeTruthy();
    });
});