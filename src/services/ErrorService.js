import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { captureScreen } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { executeQuery } from '../database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ErrorService - AgroGB Resilience Module 🛡️
 * Responsável por capturar, registrar e reportar falhas do sistema.
 */
export const ErrorService = {
    
    /**
     * Registra um erro no banco local e tenta capturar screenshot
     */
    logError: async (screen, error, stack = '') => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = stack || (error instanceof Error ? error.stack : '');
        const timestamp = new Date().toISOString();

        if (__DEV__) {
            console.log(`[ErrorService] Erro em ${screen}:`, errorMessage);
        }

        try {
            // 1. Captura Screenshot (se possível)
            let screenshotPath = null;
            try {
                screenshotPath = await captureScreen({
                    format: 'jpg',
                    quality: 0.8
                });
            } catch (e) {
                if (__DEV__) console.log("Erro ao capturar print:", e);
            }

            // 2. Salva no banco local
            const userId = await AsyncStorage.getItem('user_id');
            await executeQuery(
                `INSERT INTO error_logs (usuario_id, tela, erro, stack, created_at) VALUES (?, ?, ?, ?, ?)`,
                [userId, screen, errorMessage, errorStack, timestamp]
            );

            // 3. Notifica o usuário de forma amigável (Toast/Alert leve)
            // Alert.alert('Ops!', 'Ocorreu um erro inesperado. Nossa equipe foi notificada.');
            
            return { screenshotPath, errorMessage, timestamp };
        } catch (dbError) {
            console.error("Falha crítica ao registrar erro:", dbError);
            return null;
        }
    },

    /**
     * Gera e compartilha o relatório de erro (WhatsApp/Email)
     */
    reportLatestError: async () => {
        try {
            const res = await executeQuery(`SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 1`);
            if (res.rows.length === 0) {
                Alert.alert('Info', 'Nenhum log de erro encontrado.');
                return;
            }

            const lastError = res.rows.item(0);
            const reportBody = `
--- RELATÓRIO DE ERRO AGROGB ---
Data: ${lastError.created_at}
Tela: ${lastError.tela}
Erro: ${lastError.erro}
Stack: ${lastError.stack ? lastError.stack.substring(0, 500) : 'N/A'}
-------------------------------
            `;

            // Tenta capturar o print da tela atual para o relatório
            const uri = await captureScreen({ format: 'png', quality: 0.7 });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    dialogTitle: 'Enviar Relatório AgroGB',
                    mimeType: 'image/png',
                    UTI: 'public.png',
                });
            } else {
                // Alternativa via Email
                await MailComposer.composeAsync({
                    subject: 'Relatório de Erro AgroGB',
                    body: reportBody,
                    attachments: [uri],
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível gerar o relatório de compartilhamento.');
        }
    }
};
