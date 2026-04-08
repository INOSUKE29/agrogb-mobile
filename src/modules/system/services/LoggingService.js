import { executeQuery } from '../../../database/database';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * LoggingService - Auditoria de Erros (Diamond Pro)
 * Camada de Serviço para captura e exportação de logs técnicos.
 */
export const LoggingService = {

    /**
     * Grava um erro no banco local.
     */
    logError: async (tela, funcao, erro, stack = '') => {
        try {
            const id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const query = `
                INSERT INTO v2_error_logs (id, tela, funcao, erro, stack, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `;
            await executeQuery(query, [id, tela, funcao, String(erro), String(stack)]);
            if (__DEV__) console.warn(`[ErrorLog] Gravado: ${tela} > ${funcao}`);
        } catch (e) {
            console.error("Falha fatal ao gravar log de erro:", e);
        }
    },

    /**
     * Busca todos os logs recentes.
     */
    getLogs: async (limit = 100) => {
        try {
            const res = await executeQuery(`SELECT * FROM v2_error_logs ORDER BY created_at DESC LIMIT ?`, [limit]);
            return res.rows._array || [];
        } catch {
            return [];
        }
    },

    /**
     * Exporta os logs para um arquivo TXT e abre o menu de compartilhamento.
     */
    exportLogs: async () => {
        try {
            const logs = await LoggingService.getLogs(500);
            if (logs.length === 0) {
                return { success: false, message: "Nenhum log para exportar." };
            }

            let content = "=== AGROGB ERROR REPORT ===\n";
            content += `Gerado em: ${new Date().toLocaleString()}\n`;
            content += `Plataforma: ${Platform.OS}\n\n`;

            logs.forEach(log => {
                content += `[${log.created_at}] [${log.severity}] TELA: ${log.tela} | FUNÇÃO: ${log.funcao}\n`;
                content += `ERRO: ${log.erro}\n`;
                if (log.stack) content += `STACK: ${log.stack.substring(0, 200)}...\n`;
                content += "-----------------------------------\n";
            });

            const fileName = `agrogb_logs_${Date.now()}.txt`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
                return { success: true };
            } else {
                return { success: false, message: "O compartilhamento não está disponível neste dispositivo." };
            }
        } catch (error) {
            console.error("Erro ao exportar logs:", error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Limpa logs antigos para não ocupar espaço.
     */
    clearLogs: async () => {
        try {
            await executeQuery(`DELETE FROM v2_error_logs WHERE created_at < date('now', '-30 days')`);
        } catch (e) {
            console.error("Erro ao limpar logs:", e);
        }
    }
};
