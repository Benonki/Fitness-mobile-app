import * as SecureStore from 'expo-secure-store';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
}));

jest.mock('axios', () => {
    return {
        create: jest.fn(() => ({
            interceptors: {
                request: { use: jest.fn(), eject: jest.fn() },
                response: { use: jest.fn(), eject: jest.fn() },
            },
            defaults: { headers: { common: {} } },
            get: jest.fn(),
            post: jest.fn(),
        })),
    };
});

describe('Axios Instance', () => {
    const requestInterceptor = axiosInstance.interceptors.request.use.mock.calls[0][0];
    const errorInterceptor = axiosInstance.interceptors.request.use.mock.calls[0][1];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('powinien dodać nagłówek Authorization, jeśli token istnieje w SecureStore', async () => {
        SecureStore.getItemAsync.mockResolvedValue('super-secret-token');

        const config = { headers: {} };
        const newConfig = await requestInterceptor(config);

        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
        expect(newConfig.headers.Authorization).toBe('Bearer super-secret-token');
    });

    it('NIE powinien dodawać nagłówka Authorization, jeśli tokenu brak', async () => {
        SecureStore.getItemAsync.mockResolvedValue(null);

        const config = { headers: {} };
        const newConfig = await requestInterceptor(config);

        expect(newConfig.headers.Authorization).toBeUndefined();
    });

    it('powinien odrzucić Promise w przypadku błędu w interceptorze', async () => {
        const testError = new Error('Test Error');
        await expect(errorInterceptor(testError)).rejects.toThrow('Test Error');
    });
});