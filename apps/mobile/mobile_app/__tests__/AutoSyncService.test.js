import AutoSyncService from '../src/services/AutoSyncService';

jest.mock('../src/database/database', () => ({
    executeQuery: jest.fn(() => Promise.resolve({ rows: { length: 0, _array: [] } }))
}));

describe('AutoSyncService', () => {
    it('should not throw when starting and stopping sync worker', () => {
        expect(() => {
            AutoSyncService.start();
            AutoSyncService.stop();
        }).not.toThrow();
    });

    it('should have a queueItem method that accepts data', async () => {
        expect(AutoSyncService.queueItem).toBeDefined();
        // Just checking if we can queue safely without crashing
        await expect(AutoSyncService.queueItem('teste_tabela', '123', 'INSERT', {})).resolves.not.toThrow();
    });
});
