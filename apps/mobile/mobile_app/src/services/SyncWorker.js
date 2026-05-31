
import { supabase } from './supabaseClient';
import { executeQuery } from '../database/database';
import NetInfo from '@react-native-community/netinfo';

/**
 * SyncWorker V2
 * Processa a fila de sincronização (v2_sync_queue) de forma atômica e resiliente.
 */
export const SyncWorker = {
    
    isSyncing: false,

    /**
     * Executa um ciclo de sincronização
     */
    run: async () => {
        if (SyncWorker.isSyncing) return;
        
        try {
            const netState = await NetInfo.fetch();
            if (!netState.isConnected) return;

            SyncWorker.isSyncing = true;
            if (__DEV__) console.log('🔄 [SyncWorker] Iniciando processamento da fila...');

            // 1. Pega itens pendentes na fila
            const res = await executeQuery(
                `SELECT * FROM v2_sync_queue WHERE status = 'pending' OR status = 'failed' ORDER BY created_at ASC LIMIT 50`
            );

            if (res.rows.length === 0) {
                SyncWorker.isSyncing = false;
                return;
            }

            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                await SyncWorker.processItem(item);
            }

            if (__DEV__) console.log('✅ [SyncWorker] Ciclo de sincronização concluído.');
        } catch (error) {
            console.error('❌ [SyncWorker] Erro crítico no worker:', error);
        } finally {
            SyncWorker.isSyncing = false;
        }
    },

    /**
     * Processa um único item da fila
     */
    processItem: async (item) => {
        const { id, table_name, operation, record_id, payload } = item;
        const data = JSON.parse(payload);

        try {
            // Marca como processando localmente
            await executeQuery(`UPDATE v2_sync_queue SET status = 'processing' WHERE id = ?`, [id]);

            let response;
            if (operation === 'INSERT' || operation === 'UPDATE') {
                response = await supabase.from(table_name).upsert(data, { onConflict: 'id' });
            } else if (operation === 'DELETE') {
                response = await supabase.from(table_name).delete().eq('id', record_id);
            }

            if (response.error) throw response.error;

            // Sucesso: Remove da fila e atualiza status no banco v2
            await executeQuery(`DELETE FROM v2_sync_queue WHERE id = ?`, [id]);
            await executeQuery(`UPDATE ${table_name} SET sync_status = 'synced', updated_at = ? WHERE id = ?`, 
                [new Date().toISOString(), record_id]);

        } catch (error) {
            if (__DEV__) console.error(`⚠️ [SyncWorker] Falha em ${table_name}:${record_id}:`, error.message);
            
            // Incrementa tentativas e marca como falha para reprocessar depois
            await executeQuery(
                `UPDATE v2_sync_queue SET status = 'failed', retry_count = retry_count + 1 WHERE id = ?`,
                [id]
            );

            // Log de erro profissional
            await executeQuery(
                `INSERT INTO v2_sync_logs (id, operation, table_name, status, message) VALUES (?, ?, ?, ?, ?)`,
                [Math.random().toString(36).substr(2, 9), operation, table_name, 'error', error.message]
            );
        }
    },

    /**
     * Enfileira uma nova operação (Deve ser usado pelos Repositories)
     */
    enqueue: async (tableName, operation, recordId, data) => {
        const id = Math.random().toString(36).substr(2, 9);
        const payload = JSON.stringify(data);
        
        await executeQuery(
            `INSERT INTO v2_sync_queue (id, table_name, operation, record_id, payload, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, tableName, operation, recordId, payload, 'pending']
        );
        
        // Tenta rodar o worker imediatamente se houver conexão
        SyncWorker.run();
    }
};
