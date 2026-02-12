import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PrivateRoute from '../../src/routes/PrivateRoute';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { Text } from 'react-native';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: jest.fn(),
}));

describe('PrivateRoute', () => {
    const mockNavigation = {
        reset: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigation.mockReturnValue(mockNavigation);
    });

    it('powinien wyrenderować dzieci (chronioną treść), gdy token istnieje', async () => {
        SecureStore.getItemAsync.mockResolvedValue('valid-token');

        const { getByText } = render(
            <PrivateRoute>
                <Text>Chroniona Treść</Text>
            </PrivateRoute>
        );

        await waitFor(() => {
            expect(getByText('Chroniona Treść')).toBeTruthy();
        });

        expect(mockNavigation.reset).not.toHaveBeenCalled();
    });

    it('powinien przekierować do Login, gdy brak tokena (null)', async () => {
        SecureStore.getItemAsync.mockResolvedValue(null);

        render(
            <PrivateRoute>
                <Text>Chroniona Treść</Text>
            </PrivateRoute>
        );

        await waitFor(() => {
            expect(mockNavigation.reset).toHaveBeenCalledWith({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        });
    });

});