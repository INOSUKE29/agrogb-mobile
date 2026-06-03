import { Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
// Importação dinâmica/mockada para Web evitar avisos no console
const captureScreen = Platform.OS === 'web' ? async () => null : require('react-native-view-shot').captureScreen;
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
                `INSERT INTO error_logs (usuario_id, tela, erro, stack, created_at, data) VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, screen, errorMessage, errorStack, timestamp, timestamp]
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
    reportLatestError: async (currentError = null) => {
        try {
            let errorText = '';
            let stackText = '';
            
            if (currentError) {
                errorText = currentError.message || String(currentError);
                stackText = currentError.stack || 'N/A';
            } else {
                const res = await executeQuery(`SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 1`);
                if (res.rows.length === 0) {
                    Alert.alert('Info', 'Nenhum log de erro encontrado.');
                    return;
                }
                const lastError = res.rows.item(0);
                errorText = lastError.erro;
                stackText = lastError.stack || 'N/A';
            }

            const reportBody = `--- RELATÓRIO DE ERRO AGROGB ---
Data: ${new Date().toISOString()}
Erro: ${errorText}
Stack: ${stackText.substring(0, 1500)}
-------------------------------`;

            // Utilizar Share Nativo em vez do Expo Sharing com imagem, 
            // garantindo alta resiliência (não quebra ao tentar tirar print de view destruída)
            const { Share } = require('react-native');
            await Share.share({
                message: reportBody,
                title: 'Relatório de Erro AgroGB'
            });
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível compartilhar: ' + e.message);
        }
    }
};
