import { getSupabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const ERROR_QUEUE_KEY = '@error_queue';

export const Logger = {
    /**
     * Log a critical error to Supabase (or queue if offline)
     * @param {Error} error The error object
     * @param {string} context Where the error happened (e.g. "LoginScreen")
     * @param {object} metadata Additional info
     */
    error: async (error, context = 'Global', metadata = {}) => {
        const errorPayload = {
            message: error?.message || String(error),
            stack: error?.stack,
            context,
            metadata: JSON.stringify(metadata),
            device_info: `${Device.brand} ${Device.modelName} (${Platform.OS} ${Platform.Version})`,
            timestamp: new Date().toISOString(),
            app_version: '6.3.0',
            synced: false
        };

        // Always log to console in development
        console.error(`[CRITICAL] ${context}:`, error);

        try {
            const supabase = getSupabase();
            // Tenta enviar direto
            const { error: dbError } = await supabase.from('error_logs').insert([
                { ...errorPayload, synced: true }
            ]);

            if (dbError) throw dbError;
            console.log('✅ Erro reportado ao Admin/Supabase.');
        } catch (e) {
            console.warn('⚠️ Falha ao reportar erro online. Salvando localmente.');
            await Logger.queueError(errorPayload);
        }
    },

    /**
     * Queue error locally for later sync
     */
    queueError: async (payload) => {
        try {
            const existing = await AsyncStorage.getItem(ERROR_QUEUE_KEY);
            const queue = existing ? JSON.parse(existing) : [];
            queue.push(payload);
            await AsyncStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error('Falha grave: Não foi possível salvar erro localmente.', e);
        }
    },

    /**
     * Tries to flush the error queue to Supabase
     */
    flushQueue: async () => {
        try {
            const existing = await AsyncStorage.getItem(ERROR_QUEUE_KEY);
            if (!existing) return;

            const queue = JSON.parse(existing);
            if (queue.length === 0) return;

            const supabase = getSupabase();
            const { error } = await supabase.from('error_logs').insert(
                queue.map(item => ({ ...item, synced: true }))
            );

            if (!error) {
                await AsyncStorage.removeItem(ERROR_QUEUE_KEY);
                console.log(`✅ ${queue.length} erros sincronizados.`);
            }
        } catch (e) {
            console.log('Sem conexão para enviar logs.');
        }
    }
};
