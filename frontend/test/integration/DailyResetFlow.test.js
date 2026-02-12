import React, { useContext, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { UserProvider, UserContext } from '../../src/context/UserContext';
import { checkAndResetDailyData } from '../../src/api/accounts';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('../../src/api/axiosInstance', () => ({
    patch: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('../../src/context/NotificationContext', () => ({ NotificationsProvider: ({children}) => children }));
jest.mock('../../src/context/ProductContext', () => ({ ProductProvider: ({children}) => children }));
jest.mock('../../src/context/StepContext', () => ({ StepProvider: ({children}) => children }));


const ResetSimulationApp = ({ initialUser }) => {
    const { user, setUser } = useContext(UserContext);
    const [status, setStatus] = useState('Checking...');

    useEffect(() => {
        setUser(initialUser);
    }, []);

    useEffect(() => {
        const performCheck = async () => {
            if (user) {
                try {
                    const updatedUser = await checkAndResetDailyData(user.id, user);

                    if (updatedUser && updatedUser.lastSyncDate !== user.lastSyncDate) {
                        setUser(updatedUser);
                        setStatus('Reset Done');
                    } else {
                        setStatus('No Reset Needed');
                    }
                } catch (e) {
                    setStatus('Error');
                }
            }
        };
        performCheck();
    }, [user?.id]);

    if (!user) return <Text>Loading User...</Text>;

    return (
        <View>
            <Text testID="status">{status}</Text>
            <Text testID="user-sync-date">{user.lastSyncDate}</Text>
            <Text testID="user-calories">{user.eatenProducts ? user.eatenProducts.length : 0}</Text>
        </View>
    );
};

describe('Proces resetu dziennego', () => {
    const MOCK_TODAY = new Date('2026-01-02T12:00:00.000Z');

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_TODAY);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('powinien zresetować dane, gdy data ostatniej synchronizacji jest starsza niż dzisiaj', async () => {
        const staleUser = {
            id: 'u1',
            lastSyncDate: '2026-01-01T10:00:00.000Z',
            eatenProducts: [{ name: 'Pizza' }, { name: 'Cola' }],
            stepsTaken: 5000
        };

        axiosInstance.patch.mockResolvedValue({
            data: {
                user: {
                    ...staleUser,
                    lastSyncDate: MOCK_TODAY.toISOString(),
                    eatenProducts: [],
                    stepsTaken: 0
                }
            }
        });

        const { getByTestId, getByText } = render(
            <UserProvider>
                <ResetSimulationApp initialUser={staleUser} />
            </UserProvider>
        );

        await waitFor(() => {
            expect(axiosInstance.patch).toHaveBeenCalledWith('/users/u1/reset-daily');
        });

        expect(getByTestId('status').props.children).toBe('Reset Done');
        expect(getByText(/2026-01-02/)).toBeTruthy();
        expect(getByTestId('user-calories').props.children).toBe(0);
    });

    it('NIE powinien resetować danych, gdy data synchronizacji jest dzisiejsza', async () => {
        const freshUser = {
            id: 'u2',
            lastSyncDate: '2026-01-02T08:00:00.000Z',
            eatenProducts: [{ name: 'Owsianka' }],
            stepsTaken: 100
        };

        const { getByTestId } = render(
            <UserProvider>
                <ResetSimulationApp initialUser={freshUser} />
            </UserProvider>
        );

        await waitFor(() => {
            expect(getByTestId('status').props.children).toBe('No Reset Needed');
        });

        expect(axiosInstance.patch).not.toHaveBeenCalled();

        expect(getByTestId('user-calories').props.children).toBe(1);
    });
});