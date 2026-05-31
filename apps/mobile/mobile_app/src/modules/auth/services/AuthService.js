import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../services/supabaseClient';
import { executeQuery } from '../../../database/database';

/**
 * AuthService Modular (V1.1 DIAMOND PRO) 💎
 * Responsável por Auth, Perfis e Sessão. 🚀
 */
export const AuthService = {
    /**
     * Login com Fail-Safe de RLS e Timeout
     */
    login: async (email, password) => {
        try {
            const { data, error } = await promiseWithTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                15000,
                "Tempo de resposta do servidor excedido."
            );

            if (error) throw error;

            const session = {
                userId: data.user.id,
                email: data.user.email,
                token: data.session.access_token
            };

            await SecureStore.setItemAsync('@user_session', JSON.stringify(session));

            // Sincronização de Perfil (Fail-Safe)
            try {
                const { data: profile } = await promiseWithTimeout(
                    supabase.from('user_profiles').select('*').eq('id', data.user.id).single(),
                    10000,
                    "Timeout ao buscar perfil."
                );

                if (profile) {
                    await executeQuery(
                        `INSERT OR REPLACE INTO user_profiles (id, email, name, last_updated, sync_status) VALUES (?, ?, ?, ?, ?)`,
                        [profile.id, profile.email, profile.name, new Date().toISOString(), 'synced']
                    );
                }
            } catch (pErr) {
                console.warn('[AuthService] Perfil offline/RLS block, ignorando trava.', pErr.message);
            }

            return { success: true, user: data.user };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('@user_session');
        await supabase.auth.signOut();
    },

    getCurrentSession: async () => {
        const data = await SecureStore.getItemAsync('@user_session');
        return data ? JSON.parse(data) : null;
    }
};

const promiseWithTimeout = (promise, ms, message) => {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]);
};
