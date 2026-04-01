import { SyncWorker } from '../src/services/SyncWorker';
import NetInfo from '@react-native-community/netinfo';
import { executeQuery } from '../src/database/database';

// Mocks
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('../src/database/database', () => ({
  executeQuery: jest.fn(),
}));

jest.mock('../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({ error: null })),
      delete: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
    })),
  },
}));

describe('SyncWorker Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve interromper o ciclo se não houver internet', async () => {
    NetInfo.fetch.mockResolvedValue({ isConnected: false });
    
    await SyncWorker.run();
    
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('deve processar itens da fila quando houver internet', async () => {
    NetInfo.fetch.mockResolvedValue({ isConnected: true });
    executeQuery.mockResolvedValue({
      rows: {
        length: 1,
        item: (_) => ({
          id: '1',
          table_name: 'test_table',
          operation: 'INSERT',
          record_id: 'rec_1',
          payload: JSON.stringify({ name: 'Test' }),
        }),
      },
    });

    await SyncWorker.run();

    expect(executeQuery).toHaveBeenCalled();
    // Verifica se tentou atualizar o status para processing
    expect(executeQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE v2_sync_queue SET status = \'processing\''),
      expect.anything()
    );
  });
});
