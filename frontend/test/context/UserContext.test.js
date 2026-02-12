import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { UserContext, UserProvider } from '../../src/context/UserContext';

describe('UserContext', () => {
    it('powinien poprawnie renderować dzieci (children)', () => {
        const { getByText } = render(
            <UserProvider>
                <Text>Testowe Dziecko</Text>
            </UserProvider>
        );

        expect(getByText('Testowe Dziecko')).toBeTruthy();
    });
});