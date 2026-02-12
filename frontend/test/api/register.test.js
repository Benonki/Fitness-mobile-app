import { registerUser, isLoginAvailable } from '../../src/api/register';
import axiosInstance from '../../src/api/axiosInstance';

jest.mock('../../src/api/axiosInstance', () => ({
    get: jest.fn(),
    post: jest.fn(),
}));

describe('Register API', () => {
    const mockSetMessage = jest.fn();
    const mockSetVisible = jest.fn();
    const mockNavigation = { navigate: jest.fn() };

    const validData = {
        login: 'testuser',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Jan',
        lastName: 'Kowalski',
        weight: '80',
        height: '180',
        stepsGoal: '5000',
        exercises: '3',
        dateOfBirth: '1990-01-01',
        gender: 'Mężczyzna',
        objective: 'Utrzymanie'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isLoginAvailable', () => {
        it('powinien zwrócić false w przypadku błędu', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.get.mockRejectedValue(new Error('Error'));
            const result = await isLoginAvailable('newuser');
            expect(result).toBe(false);
            consoleSpy.mockRestore();
        });
    });

    describe('registerUser - Walidacje', () => {
        it('powinien zablokować puste pola', async () => {
            await registerUser({}, true, mockSetMessage, mockSetVisible, mockNavigation);
            expect(mockSetMessage).toHaveBeenCalledWith('Wszystkie pola muszą być wypełnione');
        });

        it('powinien zablokować zajęty login', async () => {
            axiosInstance.get.mockResolvedValue({ data: { available: false } });

            await registerUser(validData, true, mockSetMessage, mockSetVisible, mockNavigation);
            expect(mockSetMessage).toHaveBeenCalledWith('Login jest już zajęty');
        });

        it('powinien zablokować brak akceptacji regulaminu', async () => {
            axiosInstance.get.mockResolvedValue({ data: { available: true } });

            await registerUser(validData, false, mockSetMessage, mockSetVisible, mockNavigation);
            expect(mockSetMessage).toHaveBeenCalledWith('Musisz zaakceptować warunki użytkowania');
        });

        it('powinien zablokować ujemne wartości', async () => {
            axiosInstance.get.mockResolvedValue({ data: { available: true } });
            const badData = { ...validData, weight: '-5' };

            await registerUser(badData, true, mockSetMessage, mockSetVisible, mockNavigation);
            expect(mockSetMessage).toHaveBeenCalledWith('Waga, wzrost muszą być większe niż 0');
        });
    });

    describe('registerUser - Sukces i Błąd API', () => {
        it('powinien zarejestrować użytkownika i nawigować do Login', async () => {
            axiosInstance.get.mockResolvedValue({ data: { available: true } });
            axiosInstance.post.mockResolvedValue({});

            await registerUser(validData, true, mockSetMessage, mockSetVisible, mockNavigation);

            expect(axiosInstance.post).toHaveBeenCalledWith('/users', expect.objectContaining({
                login: 'testuser',
                weight: 80,
                stepsGoal: 5000
            }));

            expect(mockSetMessage).toHaveBeenCalledWith('Rejestracja zakończona sukcesem');
            expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
        });

        it('powinien obsłużyć błąd API podczas rejestracji', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            axiosInstance.get.mockResolvedValue({ data: { available: true } });
            axiosInstance.post.mockRejectedValue(new Error('API Fail'));

            await registerUser(validData, true, mockSetMessage, mockSetVisible, mockNavigation);

            expect(mockSetMessage).toHaveBeenCalledWith('Wystąpił błąd podczas rejestracji');
            expect(mockSetVisible).toHaveBeenCalledWith(true);
            consoleSpy.mockRestore();
        });
    });
});