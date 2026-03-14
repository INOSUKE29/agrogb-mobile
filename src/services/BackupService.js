
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { executeQuery } from '../database/database';
import { getSupabase } from './supabase';



// Tabelas para incluir no backup
const TABLES = [
    'usuarios', 'colheitas', 'monitoramento', 'vendas', 'config', 'estoque', 
    'compras', 'plantio', 'custos', 'descarte', 'cadastro', 'clientes', 
    'culturas', 'maquinas', 'manutencao_frota', 'receitas', 'profiles', 
    'movimentacoes_financeiras', 'app_settings', 'planos_adubacao', 
    'monitoramento_entidade', 'monitoramento_media', 'analise_ia', 
    'base_conhecimento_pro', 'cadastro_midia', 'auditoria_cadastro', 
    'cost_categories', 'costs', 'areas', 'caderno_notas', 
    'categorias_despesa', 'activity_log', 'error_logs', 'unidades_medida', 
    'movimentacao_estoque'
];

export const BackupService = {

    /**
     * Gera um dump completo do SQLite em JSON
     */
    generateDump: async () => {
        const dump = {
            version: '8.1',
            timestamp: new Date().toISOString(),
            data: {}
        };

        for (const table of TABLES) {
            const res = await executeQuery(`SELECT * FROM ${table}`);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                rows.push(res.rows.item(i));
            }
            dump.data[table] = rows;
        }

        return dump;
    },

    /**
     * BACKUP LOCAL: Salva e compartilha o arquivo JSON
     */
    runLocalBackup: async () => {
        try {
            const dump = await BackupService.generateDump();
            const fileName = `backup_agrogb_${new Date().toISOString().split('T')[0]}.json`;
            const filePath = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(dump));

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath);
            }
            return { success: true, path: filePath };
        } catch (e) {
            console.error('Falha no Backup Local:', e);
            throw e;
        }
    },

    /**
     * BACKUP NUVEM: Envia dump para o Supabase Storage
     */
    runCloudBackup: async () => {
        try {
            const supabase = getSupabase();
            const dump = await BackupService.generateDump();
            const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

            // O Supabase JS espera um Blob ou ArrayBuffer no upload. 
            // Em React Native convertemos a string para Blob.
            const response = await supabase.storage
                .from('backups do agrogb')
                .upload(`backups/${fileName}`, JSON.stringify(dump), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (response.error) throw response.error;
            return { success: true, data: response.data };
        } catch (e) {
            console.error('Falha no Backup Nuvem:', e);
            throw e;
        }
    },

    /**
     * RESTAURAÇÃO: Seleciona arquivo e sobrescreve banco local
     */
    restoreFromFile: async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
            if (result.canceled) return { success: false, message: 'Cancelado' };

            const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
            const backup = JSON.parse(content);

            if (!backup.data) throw new Error('Arquivo de backup inválido');

            // Importar tabelas (isso é uma operação destrutiva/sobrescreve)
            for (const table of Object.keys(backup.data)) {
                if (!TABLES.includes(table)) continue;

                // Limpar tabela atual
                await executeQuery(`DELETE FROM ${table}`);

                const rows = backup.data[table];
                for (const row of rows) {
                    const keys = Object.keys(row);
                    const placeholders = keys.map(() => '?').join(', ');
                    const values = keys.map(k => row[k]);
                    await executeQuery(
                        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
            }

            return { success: true };
        } catch (e) {
            console.error('Falha na Restauração:', e);
            throw e;
        }
    }
};
