import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabaseClient';
import { executeQuery } from '../database/database';
import { SyncWorker } from './SyncWorker';

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
        return { success: false, message: e.message };
    }
};

export const login = async (email, password) => {
    try {
        if (__DEV__) console.log(`[AuthService] Tentativa de login para: ${email}`);

        // 1. Login no Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // 2. Salva Sessão localmente
        const session = {
            userId: data.user.id,
            email: data.user.email,
            token: data.session.access_token
        };

        await safeSave('@user_session', session);

        // 3. Verifica se o produtor existe localmente no V2, senão cria/puxa
        const localCheck = await executeQuery(`SELECT id FROM v2_produtores WHERE id = ?`, [data.user.id]);
        if (localCheck.rows.length === 0) {
            await executeQuery(
                `INSERT INTO v2_produtores (id, email, sync_status) VALUES (?, ?, ?)`,
                [data.user.id, data.user.email, 'synced']
            );
        }

        return { success: true, user: data.user };

    } catch (e) {
        if (__DEV__) console.error("LOGIN_ERROR:", e.message);
        return { success: false, message: e.message };
    }
};

const checkSession = async () => {
    return await safeGet("session");
};

export const logout = async () => {
    try {
        console.log('[AuthService] Logging out...');
        await safeRemove("session");
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
