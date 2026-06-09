import { executeQuery, initDB } from '../src/database/database';

jest.mock('expo-sqlite', () => ({
    openDatabase: jest.fn(() => ({
        transaction: jest.fn((callback) => {
            callback({
                executeSql: jest.fn((sql, params, success, error) => {
                    success({}, { rows: { length: 0, item: () => ({}) } });
                }),
            });
        }),
    })),
}));

describe('Database SQLite Wrapper', () => {
    it('should initialize the database without errors', async () => {
        const db = await initDB();
        expect(db).toBeDefined();
    });

    it('should execute a query successfully', async () => {
        await initDB();
        const result = await executeQuery('SELECT * FROM config');
        expect(result.rows).toBeDefined();
    });
});
