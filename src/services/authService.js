import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabaseClient';
import { executeQuery } from '../database/database';

// --- STORAGE HELPERS ---
const safeSave = async (key, value) => {
    try {
        await SecureStore.setItemAsync(key, JSON.stringify(value));
    } catch (e) {
        if (__DEV__) console.error("SECURE_STORAGE_SAVE_ERROR:", e);
    }
};

const safeGet = async (key) => {
    try {
        const data = await SecureStore.getItemAsync(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        if (__DEV__) console.error("SECURE_STORAGE_GET_ERROR:", e);
        return null;
    }
};

const safeRemove = async (key) => {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (e) {
        if (__DEV__) console.error("SECURE_STORAGE_REMOVE_ERROR:", e);
    }
};

// --- AUTH FUNCTIONS ---

export const register = async (nome, email, password) => {
    try {
        if (__DEV__) console.log('[AuthService] Iniciando registro:', email);

        // 1. Registro no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Registro Local (Offline-First) no Schema V2
        const producerData = {
            id: userId,
            nome,
            email,
            created_at: new Date().toISOString(),
            sync_status: 'synced' // Já foi pro Supabase Auth
        };

        await executeQuery(
            `INSERT INTO v2_produtores (id, nome, email, created_at, sync_status) VALUES (?, ?, ?, ?, ?)`,
            [userId, nome, email, producerData.created_at, 'synced']
        );

        return { success: true, user: authData.user };

    } catch (e) {
        if (__DEV__) console.error("REGISTER_ERROR:", e.message);
        
        // Mensagem Amigável para Senhas Vazadas (Supabase Auth Security)
        if (e.message?.includes('leaked') || e.message?.includes('compromised')) {
            return { 
                success: false, 
                message: "Esta senha foi encontrada em um vazamento de dados conhecido (Data Breach). Por favor, escolha uma senha mais forte e exclusiva para sua segurança." 
            };
        }

        return { success: false, message: e.message };
    }
};

export const login = async (email, password) => {
    try {
        if (__DEV__) console.log('[AuthService] Chamando Supabase signIn (com timeout de 15s)...');
        
        // 1. Login no Supabase Auth com Timeout
        const { data, error } = await promiseWithTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            15000,
            "Tempo de resposta do servidor excedido. Verifique sua conexão."
        );

        if (__DEV__) console.log('[AuthService] Resposta Supabase recebida:', { hasData: !!data, hasError: !!error });

        if (error) {
            if (__DEV__) console.log('[AuthService] Erro retornado pelo Supabase:', error.message);
            throw error;
        }

        // 2. Salva Sessão localmente
        const session = {
            userId: data.user.id,
            email: data.user.email,
            token: data.session.access_token
        };

        if (__DEV__) console.log('[AuthService] Salvando sessão no SecureStore...');
        await safeSave('@user_session', session);

        // 3. Verifica se o produtor existe localmente no V2, senão cria/puxa com Timeout
        if (__DEV__) console.log('[AuthService] Verificando produtor local no SQLite...');
        
        const localCheck = await promiseWithTimeout(
            executeQuery(`SELECT id FROM v2_produtores WHERE id = ?`, [data.user.id]),
            5000,
            "O banco de dados local não respondeu. Tente reiniciar o app."
        );
        
        if (localCheck.rows.length === 0) {
            if (__DEV__) console.log('[AuthService] Criando registro de produtor local...');
            await executeQuery(
                `INSERT INTO v2_produtores (id, email, sync_status) VALUES (?, ?, ?)`,
                [data.user.id, data.user.email, 'synced']
            );
        }

        if (__DEV__) console.log('[AuthService] Login concluído com sucesso.');
        return { success: true, user: data.user };

    } catch (e) {
        if (__DEV__) console.error("LOGIN_FATAL_ERROR:", e);
        return { success: false, message: e.message || "Erro interno de autenticação" };
    }
};

/**
 * Auxiliar para Timeout de Promessa
 */
const promiseWithTimeout = (promise, ms, message) => {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]);
};

const checkSession = async () => {
    return await safeGet("@user_session");
};

export const logout = async () => {
    try {
        if (__DEV__) console.log('[AuthService] Logging out...');
        await safeRemove("@user_session");
    } catch (e) {
        console.error("LOGOUT_ERROR:", e);
    }
};

// --- PASSWORD RESET (v10.0) ---
const requestPasswordReset = async (email) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return { success: true, message: "Link de recuperação enviado para seu e-mail!" };
    } catch (e) {
        return { success: false, message: e.message };
    }
};

export const AuthService = {
    register,
    login,
    logout,
    checkSession,
    requestPasswordReset
};
