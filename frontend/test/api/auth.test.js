import { checkStoredData, handleLogin, handleLogout } from '../../src/api/auth';
import axiosInstance from '../../src/api/axiosInstance';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { checkAndResetDailyData } from '../../src/api/accounts';

jest.mock('../../src/api/axiosInstance', () => ({
    get: jest.fn(),
    post: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('../../src/api/accounts', () => ({
    checkAndResetDailyData: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('Auth API', () => {
    const mockSetUser = jest.fn();
    const mockNavigation = {
        navigate: jest.fn(),
        reset: jest.fn(),
    };
    const mockSetLoading = jest.fn();
    const mockSetMessage = jest.fn();
    const mockSetVisible = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkStoredData', () => {
        it('powinien automatycznie zalogować, jeśli są dane w SecureStore', async () => {
            SecureStore.getItemAsync.mockImplementation((key) => {
                if (key === 'userToken') return Promise.resolve('valid-token');
                if (key === 'userLogin') return Promise.resolve('testUser');
                return Promise.resolve(null);
            });

            const mockUserData = { id: 1, login: 'testUser' };
            axiosInstance.get.mockResolvedValue({ data: mockUserData });
            checkAndResetDailyData.mockResolvedValue(mockUserData);

            await checkStoredData(mockSetUser, mockNavigation, mockSetLoading);

            expect(axiosInstance.get).toHaveBeenCalledWith('/auth?login=testUser', expect.anything());
            expect(mockSetUser).toHaveBeenCalledWith(mockUserData);
            expect(mockNavigation.navigate).toHaveBeenCalledWith('DrawerNav');
            expect(mockSetLoading).toHaveBeenCalledWith(false);
        });

        it('powinien wyczyścić dane i wylogować przy błędzie 401', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            SecureStore.getItemAsync.mockResolvedValue('old-token');

            const error401 = { response: { status: 401 } };
            axiosInstance.get.mockRejectedValue(error401);

            await checkStoredData(mockSetUser, mockNavigation, mockSetLoading);

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
            expect(Alert.alert).toHaveBeenCalledWith('Sesja wygasła', 'Zaloguj się ponownie');
            expect(mockSetLoading).toHaveBeenCalledWith(false);

            consoleSpy.mockRestore();
        });

        it('nie powinien robić nic (tylko setLoading false), jeśli brak danych w SecureStore', async () => {
            SecureStore.getItemAsync.mockResolvedValue(null);

            await checkStoredData(mockSetUser, mockNavigation, mockSetLoading);

            expect(axiosInstance.get).not.toHaveBeenCalled();
            expect(mockSetLoading).toHaveBeenCalledWith(false);
        });

        it('powinien obsłużyć inny błąd niż 401 (np. 500) i wyczyścić dane', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            SecureStore.getItemAsync.mockResolvedValue('token');

            const error500 = { response: { status: 500 } };
            axiosInstance.get.mockRejectedValue(error500);

            await checkStoredData(mockSetUser, mockNavigation, mockSetLoading);

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
            expect(Alert.alert).not.toHaveBeenCalledWith('Sesja wygasła', expect.anything());

            consoleSpy.mockRestore();
        });
    });

    describe('handleLogin', () => {
        it('powinien zalogować poprawnie i zapisać token', async () => {
            const mockResponse = {
                data: {
                    token: 'new-token',
                    user: { id: 123, login: 'newUser' }
                }
            };
            axiosInstance.post.mockResolvedValue(mockResponse);
            checkAndResetDailyData.mockResolvedValue(mockResponse.data.user);

            await handleLogin('newUser', 'password123', mockSetUser, mockSetMessage, mockSetVisible, mockNavigation, false);

            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'new-token');
            expect(mockSetUser).toHaveBeenCalledWith(mockResponse.data.user);
            expect(mockNavigation.navigate).toHaveBeenCalledWith('DrawerNav');
        });

        it('powinien zapisać login w SecureStore, jeśli autoLogin = true', async () => {
            const mockResponse = { data: { token: 't', user: { id: 1, login: 'u' } } };
            axiosInstance.post.mockResolvedValue(mockResponse);
            checkAndResetDailyData.mockResolvedValue(mockResponse.data.user);

            await handleLogin('u', 'p', mockSetUser, mockSetMessage, mockSetVisible, mockNavigation, true);

            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userLogin', 'u');
        });

        it('powinien obsłużyć błąd logowania i ustawić komunikat', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const errorResponse = { response: { data: { message: 'Błędne hasło' } } };
            axiosInstance.post.mockRejectedValue(errorResponse);

            await handleLogin('u', 'p', mockSetUser, mockSetMessage, mockSetVisible, mockNavigation, false);

            expect(mockSetMessage).toHaveBeenCalledWith('Błędne hasło');
            expect(mockSetVisible).toHaveBeenCalledWith(true);
            expect(mockSetUser).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('powinien użyć domyślnego komunikatu błędu, jeśli odpowiedź serwera go nie zawiera', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const networkError = new Error('Network Error');
            axiosInstance.post.mockRejectedValue(networkError);

            await handleLogin('u', 'p', mockSetUser, mockSetMessage, mockSetVisible, mockNavigation, false);

            expect(mockSetMessage).toHaveBeenCalledWith('Błąd podczas logowania');
            expect(mockSetVisible).toHaveBeenCalledWith(true);

            consoleSpy.mockRestore();
        });
    });

    describe('handleLogout', () => {
        it('powinien wyczyścić dane i zresetować nawigację po potwierdzeniu wylogowania', async () => {
            Alert.alert.mockImplementation((title, message, buttons) => {
                const logoutButton = buttons.find(btn => btn.text === 'Wyloguj');
                logoutButton.onPress();
            });

            await handleLogout(mockSetUser, mockNavigation);

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userLogin');
            expect(mockSetUser).toHaveBeenCalledWith(null);
            expect(mockNavigation.reset).toHaveBeenCalledWith({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        });

        it('nie powinien robić nic po kliknięciu "Anuluj"', async () => {
            Alert.alert.mockImplementation((title, message, buttons) => {
                const cancelButton = buttons.find(btn => btn.text === 'Anuluj');
                cancelButton.onPress();
            });

            await handleLogout(mockSetUser, mockNavigation);

            expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
            expect(mockNavigation.reset).not.toHaveBeenCalled();
        });
    });
});