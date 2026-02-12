const userProductsService = require('../../services/userProductsService');

jest.mock('../../models/User', () => {
    const mockUserConstructor = jest.fn();
    mockUserConstructor.findById = jest.fn();
    return mockUserConstructor;
});
const User = require('../../models/User');

describe('UserProductsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserProducts', () => {
        it('powinien zwrócić listę zjedzonych produktów', async () => {
            const mockProducts = [{ name: 'Apple', calories: 50 }];
            User.findById.mockResolvedValue({ eatenProducts: mockProducts });

            const result = await userProductsService.getUserProducts('123');
            expect(result).toEqual(mockProducts);
        });

        it('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
            User.findById.mockResolvedValue(null);
            await expect(userProductsService.getUserProducts('123'))
                .rejects.toThrow('Uzytkownik nie znaleziony');
        });
    });

    describe('updateUserProducts', () => {
        it('powinien zaktualizować produkty i zapisać', async () => {
            const saveMock = jest.fn();
            const mockUser = {
                _id: '123',
                eatenProducts: [],
                save: saveMock
            };

            User.findById.mockResolvedValue(mockUser);

            const inputProducts = [
                { name: 'Good', calories: 100 },
                { name: 'Bad', calories: 0 },
                { name: 'Worse', calories: -5 }
            ];

            const result = await userProductsService.updateUserProducts('123', inputProducts);

            expect(User.findById).toHaveBeenCalledWith('123');
            expect(mockUser.eatenProducts).toHaveLength(3);
            expect(mockUser.eatenProducts[0].name).toBe('Good');
            expect(saveMock).toHaveBeenCalled();
            expect(result).toEqual(mockUser.eatenProducts);
        });
    });
});