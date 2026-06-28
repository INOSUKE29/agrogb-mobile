import { executeQuery } from '../database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

class SyncWorker {
    constructor() {
        this.isSyncing = false;
    }

    async processSyncQueue() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        console.log('[SyncWorker] Iniciando varredura da fila (sync_outbox)...');

        try {
            // 1. Buscar todos os registros pendentes
            const res = await executeQuery("SELECT * FROM sync_outbox WHERE status = 'PENDENTE' ORDER BY criado_em ASC");
            
            if (res.rows.length === 0) {
                console.log('[SyncWorker] Fila vazia. Tudo sincronizado.');
                this.isSyncing = false;
                return;
            }

            console.log(`[SyncWorker] Encontrados ${res.rows.length} registros para sincronizar.`);

            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                console.log(`[SyncWorker] Processando item ${item.uuid} da tabela ${item.tabela} (Ação: ${item.acao})`);

                const payload = JSON.parse(item.payload_json);

                // SIMULAÇÃO DE UPLOAD PARA A NUVEM
                // Em um cenário real, aqui entraria o fetch() para a API do Supabase

                // Regra 12: Expurgar mídia local após o upload
                if (item.tabela === 'monitoramento_media' && payload.tipo === 'IMAGEM') {
                    console.log(`[SyncWorker] ☁️ Simulando Upload de Mídia para Supabase Storage: ${payload.caminho_arquivo}`);
                    // await uploadToSupabaseStorage(payload.caminho_arquivo);
                    
                    // Simula a URL recebida da nuvem
                    const cloudUrl = `https://agrogb.supabase.co/storage/v1/object/public/diagnosticos/${payload.uuid}.jpg`;
                    console.log(`[SyncWorker] ✅ Imagem salva na nuvem: ${cloudUrl}`);

                    // Apagar arquivo físico local para economizar memória (Regra 12)
                    try {
                        // Verifica se é um arquivo local válido (file://)
                        if (payload.caminho_arquivo && payload.caminho_arquivo.startsWith('file://')) {
                            await FileSystem.deleteAsync(payload.caminho_arquivo, { idempotent: true });
                            console.log(`[SyncWorker] 🗑️ Arquivo local apagado com sucesso (Economia de Storage).`);
                        }
                    } catch (fsErr) {
                        console.error(`[SyncWorker] Falha ao apagar arquivo local:`, fsErr);
                    }

                    // Atualizar tabela de mídia local com a URL real e sync=1
                    await executeQuery(
                        "UPDATE monitoramento_media SET caminho_arquivo = ?, sync_status = 1 WHERE uuid = ?",
                        [cloudUrl, payload.uuid]
                    );
                } else {
                    console.log(`[SyncWorker] ☁️ Simulando Envio de JSON para Backend:`, payload);
                    // Atualiza sync_status da tabela de origem
                    try {
                        await executeQuery(`UPDATE ${item.tabela} SET sync_status = 1 WHERE uuid = ?`, [item.registro_uuid]);
                    } catch (tableErr) {
                        console.log(`[SyncWorker] Aviso: A tabela ${item.tabela} pode não ter a coluna sync_status ou o registro foi apagado.`);
                    }
                }

                // 2. Marcar como concluído na fila
                await executeQuery("UPDATE sync_outbox SET status = 'CONCLUIDO', payload_json = NULL WHERE uuid = ?", [item.uuid]);
                console.log(`[SyncWorker] ✅ Item ${item.uuid} finalizado.`);
                
                // Pequeno delay para não travar a UI (Simula rede)
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log('[SyncWorker] 🎉 Varredura finalizada com sucesso!');
        } catch (error) {
            console.error('[SyncWorker] Erro crítico durante a sincronização:', error);
        } finally {
            this.isSyncing = false;
        }
    }
}

export default new SyncWorker();
