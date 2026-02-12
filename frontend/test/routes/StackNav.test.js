import React from 'react';
import { render, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';
import StackNav from '../../src/routes/StackNav';

jest.mock('@react-navigation/native-stack', () => {
    const React = require('react');
    const { View } = require('react-native');

    return {
        createNativeStackNavigator: () => ({
            Navigator: ({ children }) => React.createElement(View, { testID: 'Stack.Navigator' }, children),
            Screen: ({ name, component, children, options, ...props }) => {
                let content;

                if (component) {
                    content = React.createElement(component, props);
                } else if (typeof children === 'function') {
                    content = children(props);
                } else {
                    content = children;
                }

                let headerBackgroundElement = null;
                if (options?.headerBackground) {
                    headerBackgroundElement = options.headerBackground();
                }

                return (
                    <View testID={`Stack.Screen.${name}`}>
                        {headerBackgroundElement}
                        {content}
                    </View>
                );
            },
        }),
    };
});

jest.mock('../../src/routes/PrivateRoute', () => {
    const React = require('react');
    const { View } = require('react-native');
    return ({ children }) => <View testID="private-route-wrapper">{children}</View>;
});

jest.mock('../../src/screens/Login', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return () => <Text>Login Screen</Text>;
});

jest.mock('../../src/screens/Rejestracja', () => () => null);
jest.mock('../../src/screens/OpisTreningu', () => () => null);
jest.mock('../../src/screens/Informacje', () => () => null);
jest.mock('../../src/screens/DodaneProdukty', () => () => null);

jest.mock('../../src/routes/DrawerNav', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return () => <Text>Drawer Content</Text>;
});

jest.mock('expo-linear-gradient', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        LinearGradient: () => <View testID="mock-linear-gradient" />
    };
});

describe('StackNav', () => {
    it('powinien owijać chronione ekrany (np. DrawerNav) w komponent PrivateRoute', async () => {
        const { getByTestId } = render(
            <NavigationContainer>
                <StackNav />
            </NavigationContainer>
        );

        const drawerScreen = getByTestId('Stack.Screen.DrawerNav');

        const privateWrapper = within(drawerScreen).getByTestId('private-route-wrapper');

        expect(privateWrapper).toBeTruthy();
    });


});