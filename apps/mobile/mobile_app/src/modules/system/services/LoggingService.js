import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { executeQuery } from '../../../database/database';
import { Platform } from 'react-native';

/**
 * LoggingService - Auditoria e Exportação de Logs do Sistema 🛡️📑
 * Consolida relatórios de auditoria e erros locais em arquivos textuais
 * exportáveis para suporte técnico e conformidade regulatória.
 */
export const LoggingService = {
    /**
     * Exporta os últimos logs de auditoria e erros em arquivo de texto legível
     */
    exportLogs: async () => {
        try {
            console.log('[LoggingService] Iniciando exportação de logs...');

            // 1. Busca logs de auditoria
            let auditLines = '=== AUDIT LOGS (Últimos 100) ===\n';
            try {
                const auditRes = await executeQuery('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
                const auditRows = auditRes.rows._array || [];
                if (auditRows.length > 0) {
                    auditRows.forEach(log => {
                        auditLines += `[${log.data || 'N/A'}] Ação: ${log.acao || 'N/A'} | Tabela: ${log.tabela || 'N/A'} | Usuário: ${log.usuario_uuid || 'N/A'}\nDetalhes: ${log.detalhes || 'N/A'}\n----------------------------------------\n`;
                    });
                } else {
                    auditLines += 'Nenhum log de auditoria encontrado.\n';
                }
            } catch (e) {
                auditLines += `Falha ao ler audit_logs: ${e.message}\n`;
            }

            // 2. Busca logs de erro
            let errorLines = '\n=== ERROR LOGS (Últimos 100) ===\n';
            try {
                const errorRes = await executeQuery('SELECT * FROM error_logs ORDER BY id DESC LIMIT 100');
                const errorRows = errorRes.rows._array || [];
                if (errorRows.length > 0) {
                    errorRows.forEach(log => {
                        errorLines += `[${log.created_at || log.data || 'N/A'}] Tela: ${log.tela || 'N/A'} | Erro: ${log.erro || 'N/A'}\nStack: ${log.stack || 'N/A'}\n----------------------------------------\n`;
                    });
                } else {
                    errorLines += 'Nenhum log de erro registrado.\n';
                }
            } catch (e) {
                errorLines += `Falha ao ler error_logs: ${e.message}\n`;
            }

            // 3. Monta o relatório final
            const reportContent = `AGROGB SYSTEM LOGS REPORT\nGerado em: ${new Date().toISOString()}\nPlataforma: ${Platform.OS} (v${Platform.Version})\n\n${auditLines}${errorLines}`;

            // 4. Cria arquivo local temporário
            const filename = `AgroGB_Logs_${Date.now()}.txt`;
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, reportContent, { encoding: FileSystem.EncodingType.UTF8 });

            // 5. Compartilha nativamente
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(fileUri, {
                    dialogTitle: 'Exportar Relatório de Logs AgroGB',
                    mimeType: 'text/plain',
                    UTI: 'public.plain-text'
                });
                return { success: true, message: 'Relatório compartilhado com sucesso!' };
            } else {
                return { success: false, message: 'Compartilhamento nativo indisponível neste dispositivo.' };
            }
        } catch (error) {
            console.error('[LoggingService] Erro ao exportar logs:', error);
            return { success: false, message: `Falha crítica na exportação: ${error.message}` };
        }
    }
};
