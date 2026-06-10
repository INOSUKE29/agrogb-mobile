import { supabase } from './supabaseClient';
import { executeQuery } from '../database/database';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

/**
 * SyncWorker V3 (Motor Titânio)
 * Processa a fila de sincronização (sync_outbox) de forma atômica e resiliente.
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
            if (__DEV__) console.log('🔄 [SyncWorker V3] Iniciando processamento da fila de transações...');

            // 1. Pega itens pendentes na fila (PENDENTE ou FALHA)
            const res = await executeQuery(
                `SELECT * FROM sync_outbox WHERE status = 'PENDENTE' OR status = 'FALHA' ORDER BY criado_em ASC LIMIT 50`
            );

            if (res.rows.length === 0) {
                SyncWorker.isSyncing = false;
                return;
            }

            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                await SyncWorker.processItem(item);
            }

            if (__DEV__) console.log('✅ [SyncWorker V3] Ciclo de sincronização concluído com sucesso.');
        } catch (error) {
            console.error('❌ [SyncWorker V3] Erro crítico no worker:', error);
        } finally {
            SyncWorker.isSyncing = false;
        }
    },

    /**
     * Processa um único item da fila
     */
    processItem: async (item) => {
        const { uuid, tabela, acao, registro_uuid, payload_json } = item;
        let data = {};
        
        try {
            if (payload_json) data = JSON.parse(payload_json);
        } catch (e) {
            console.error('❌ Erro de parse no payload:', payload_json);
        }

        try {
            // Marca como processando localmente
            await executeQuery(`UPDATE sync_outbox SET status = 'PROCESSANDO' WHERE uuid = ?`, [uuid]);

            let response;
            if (acao === 'INSERT' || acao === 'UPDATE') {
                response = await supabase.from(tabela).upsert(data, { onConflict: 'uuid' });
            } else if (acao === 'DELETE') {
                response = await supabase.from(tabela).delete().eq('uuid', registro_uuid);
            }

            if (response && response.error) throw response.error;

            // Sucesso: Remove da fila e atualiza status local na tabela de origem (opcional)
            await executeQuery(`DELETE FROM sync_outbox WHERE uuid = ?`, [uuid]);
            
            // Tentativa otimista de marcar sync_status = 1 na tabela original
            try {
                await executeQuery(`UPDATE ${tabela} SET sync_status = 1 WHERE uuid = ?`, [registro_uuid]);
            } catch (ignore) { }

        } catch (error) {
            if (__DEV__) console.error(`⚠️ [SyncWorker V3] Falha em ${tabela}:${registro_uuid}:`, error.message);
            
            // Incrementa tentativas e marca como falha para reprocessar depois
            await executeQuery(
                `UPDATE sync_outbox SET status = 'FALHA', tentativas = tentativas + 1 WHERE uuid = ?`,
                [uuid]
            );
        }
    },

    /**
     * Enfileira uma nova operação (Deve ser usado pelo database.js central)
     */
    enqueue: async (tabela, acao, registro_uuid, data) => {
        const id = uuidv4();
        const payload = data ? JSON.stringify(data) : null;
        const now = new Date().toISOString();
        
        await executeQuery(
            `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, tabela, registro_uuid, acao, payload, 'PENDENTE', now]
        );
        
        // Tenta rodar o worker imediatamente se houver conexão
        SyncWorker.run();
    }
};
