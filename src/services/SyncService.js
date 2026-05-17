import { syncTable, testConnection } from './supabase';
import { AppState } from 'react-native';

/**
 * SyncService
 * Gerencia a sincronização automática em background.
 */

const TABLES_TO_SYNC = [
    'usuarios', 
    'colheitas', 
    'vendas', 
    'compras', 
    'plantio', 
    'custos', 
    'descarte', 
    'cadastro', 
    'clientes', 
    'culturas', 
    'maquinas', 
    'manutencao_frota', 
    'planos_adubacao', 
    'etapas_adubacao',
    'equipes', 
    'caderno_notas', 
    'financeiro_transacoes'
];

let isSyncing = false;
let syncInterval = null;
let listeners = [];

const SyncService = {
    subscribe: (callback) => {
        listeners.push(callback);
        return () => {
            listeners = listeners.filter(l => l !== callback);
        };
    },

    notify: (status) => {
        listeners.forEach(l => l(status));
    },

    startAutoSync: () => {
        if (syncInterval) return;

        console.log('📡 Auto-Sync Service iniciado.');
        
        // Executa imediatamente ao iniciar
        SyncService.performSync();

        // Agenda para cada 5 minutos (300000 ms)
        syncInterval = setInterval(() => {
            SyncService.performSync();
        }, 300000);

        // Listener para AppState (Sync ao voltar para o app)
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                console.log('🔄 App voltou para foreground, disparando sync...');
                SyncService.performSync();
            }
        });

        return () => {
            clearInterval(syncInterval);
            subscription.remove();
        };
    },

    performSync: async () => {
        if (isSyncing) return;
        
        const isOnline = await testConnection();
        if (!isOnline) {
            console.log('☁️ Offline: Sincronização adiada.');
            return;
        }

        isSyncing = true;
        SyncService.notify(true);
        console.log('🚀 Iniciando sincronização automática de todas as tabelas...');

        try {
            for (const table of TABLES_TO_SYNC) {
                await syncTable(table);
            }
            console.log('✅ Sincronização concluída com sucesso.');
        } catch (error) {
            console.error('❌ Erro durante o Auto-Sync:', error);
        } finally {
            isSyncing = false;
            SyncService.notify(false);
        }
    }
};

export const performSync = SyncService.performSync;
export default SyncService;
