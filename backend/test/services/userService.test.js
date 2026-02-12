const userService = require('../../services/userService');
const fs = require('fs');
const path = require('path');

jest.mock('../../models/User', () => {
    const mockUserConstructor = jest.fn();
    mockUserConstructor.findById = jest.fn().mockReturnThis();
    mockUserConstructor.findOne = jest.fn().mockReturnThis();
    mockUserConstructor.findByIdAndUpdate = jest.fn().mockReturnThis();
    mockUserConstructor.countDocuments = jest.fn();
    mockUserConstructor.insertMany = jest.fn();
    mockUserConstructor.select = jest.fn();
    return mockUserConstructor;
});

const mockUserModel = require('../../models/User');

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    unlinkSync: jest.fn(),
    writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
    extname: jest.fn(() => '.jpg'),
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
}));

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockUserModel.findById.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue(null)
        }));
        mockUserModel.findOne.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue(null)
        }));
        mockUserModel.findByIdAndUpdate.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue(null)
        }));
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('getUser', () => {
        it('powinien zwrócić użytkownika bez hasła', async () => {
            const mockUser = {
                _id: '123',
                login: 'test',
                name: 'Test',
                lastName: 'User',
                imageUri: null,
                toObject: () => ({ _id: '123', login: 'test', name: 'Test' })
            };

            mockUserModel.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            const result = await userService.getUser('123');

            expect(mockUserModel.findById).toHaveBeenCalledWith('123');
            expect(result).toEqual(mockUser);
        });

        it('powinien przetworzyć obraz base64 gdy imageUri istnieje', async () => {
            const mockUser = {
                _id: '123',
                login: 'test',
                name: 'Test',
                lastName: 'User',
                imageUri: '/uploads/test.jpg'
            };

            const mockImageBuffer = Buffer.from('fake-image-data');

            mockUserModel.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(mockImageBuffer);
            path.extname.mockReturnValue('.jpg');

            const result = await userService.getUser('123');

            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(result.imageUri).toContain('data:image/jpeg;base64,');
        });

        it('powinien ustawić imageUri na null, jeśli plik fizycznie nie istnieje', async () => {
            const mockUser = {
                _id: '123',
                imageUri: '/uploads/missing.jpg'
            };

            mockUserModel.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            fs.existsSync.mockReturnValue(false);

            const result = await userService.getUser('123');

            expect(fs.existsSync).toHaveBeenCalled();
            expect(result.imageUri).toBeNull();
        });
    });


    describe('updateUser', () => {
        it('powinien zaktualizować dane użytkownika', async () => {
            const currentUser = {
                _id: '123',
                imageUri: null
            };

            const updateData = {
                name: 'Updated',
                lastName: 'Name'
            };

            const updatedUser = {
                _id: '123',
                name: 'Updated',
                lastName: 'Name'
            };

            mockUserModel.findById.mockResolvedValueOnce(currentUser);

            mockUserModel.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(updatedUser)
            });

            const result = await userService.updateUser('123', updateData);

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
                '123',
                updateData,
                { new: true, runValidators: true }
            );
            expect(result).toEqual(updatedUser);
        });
    });

    describe('resetDaily', () => {
        it('powinien zresetować dzienne dane i dodać do historii', async () => {
            const currentUser = {
                _id: '123',
                weight: 70,
                height: 180,
                eatenProducts: [
                    { calories: 200 },
                    { calories: 300 }
                ],
                exercises: 5,
                stepsTaken: 10000,
                lastSyncDate: '2024-01-01'
            };

            const updatedUser = {
                _id: '123',
                stepsTaken: 0,
                eatenProducts: []
            };

            mockUserModel.findById.mockResolvedValue(currentUser);

            mockUserModel.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(updatedUser)
            });

            const result = await userService.resetDaily('123');

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
            expect(result.message).toContain('Dzienne dane zostały zresetowane');
            expect(result.user).toEqual(updatedUser);
        });

        it('powinien rzucić error gdy użytkownik nie istnieje', async () => {
            mockUserModel.findById.mockResolvedValue(null);

            await expect(userService.resetDaily('invalid-id')).rejects.toThrow('Użytkownik nie znaleziony');
        });
    });

    describe('createUser', () => {
        it('powinien rzucić błąd gdy login już istnieje', async () => {
            mockUserModel.findOne.mockResolvedValue({ _id: 'existing' });

            await expect(userService.createUser({ login: 'taken' }))
                .rejects.toThrow('Login juz istnieje');
        });
    });
});