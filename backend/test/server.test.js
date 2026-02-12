jest.mock('mongoose');
jest.mock('../data/initialData');
jest.mock('../app', () => ({
    listen: jest.fn()
}));

describe('Server', () => {
    let mongoose;
    let initialData;
    let app;
    let mockExit;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mongoose = require('mongoose');
        initialData = require('../data/initialData');
        app = require('../app');

        mongoose.connect.mockResolvedValue('Connected');
        initialData.initializeData.mockResolvedValue('Initialized');

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('powinien połączyć się z DB, zainicjować dane i uruchomić serwer', async () => {
        process.env.PORT = '8080';

        require('../server');

        await new Promise(resolve => setImmediate(resolve));
        await new Promise(resolve => setImmediate(resolve));

        expect(app.listen).toHaveBeenCalledWith('8080', expect.any(Function));
        const listenCallback = app.listen.mock.calls[0][1];
        listenCallback();
        expect(console.log).toHaveBeenCalledWith('Serwer działa na porcie 8080');
    });

    it('powinien zakończyć proces jeśli inicjalizacja danych się nie uda', async () => {
        mongoose.connect.mockResolvedValue('Connected');
        initialData.initializeData.mockRejectedValue(new Error('Seed Error'));

        require('../server');

        await new Promise(resolve => setImmediate(resolve));
        await new Promise(resolve => setImmediate(resolve));

        expect(initialData.initializeData).toHaveBeenCalled();
        expect(app.listen).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Błąd krytyczny'), expect.any(Error));
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});