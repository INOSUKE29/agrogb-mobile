import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from './supabaseClient';
import { executeQuery } from '../database/database';
import { StorageHelper } from './storageHelper';

/**
 * Auxiliar para Timeout de Promessa (v1.1.4+)
 */
const promiseWithTimeout = (promise, ms, message) => {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]);
};

// --- STORAGE HELPERS ---
const safeSave = async (key, value) => {
    try {
        await promiseWithTimeout(
            StorageHelper.save(key, value),
            5000,
            "Erro ao persistir dados locais."
        );
    } catch (e) {
        if (__DEV__) console.error(`[AuthService] STORAGE_SAVE_ERROR (${key}):`, e.message);
    }
};

const safeGet = async (key) => {
    try {
        return await promiseWithTimeout(
            StorageHelper.get(key),
            5000,
            "Erro ao recuperar dados locais."
        );
    } catch (e) {
        if (__DEV__) console.error(`[AuthService] STORAGE_GET_ERROR (${key}):`, e.message);
        return null;
    }
};

const safeRemove = async (key) => {
    try {
        await StorageHelper.remove(key);
    } catch (e) {
        if (__DEV__) console.error("STORAGE_REMOVE_ERROR:", e);
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
        await safeSave('user_session_v1', session);

        // 3. Busca Perfil do Usuário (v1.1.4: Background / Non-blocking)
        if (__DEV__) console.log('[AuthService] Iniciando busca de perfil em background...');
        
        // Chamada sem 'await' intencional para não bloquear a entrada na Home
        promiseWithTimeout(
            supabase.from('user_profiles').select('*').eq('id', data.user.id).single(),
            10000,
            "Background: Busca de perfil excedeu tempo limite."
        ).then(async ({ data: profile, error: profileError }) => {
            if (!profileError && profile) {
                if (__DEV__) console.log('[AuthService] Perfil sincronizado em background.');
                await executeQuery(
                    `INSERT OR REPLACE INTO user_profiles (id, email, name, last_updated, sync_status) VALUES (?, ?, ?, ?, ?)`,
                    [profile.id, profile.email, profile.name, new Date().toISOString(), 'synced']
                ).catch(e => console.warn('[AuthService] Erro ao gravar perfil SQLite:', e.message));
            }
        }).catch(err => {
            if (__DEV__) console.warn('[AuthService] Profile Sync Background failed:', err.message);
        });

        // 4. Garante registro no v2_produtores (Legado/Background)
        executeQuery(`SELECT id FROM v2_produtores WHERE id = ?`, [data.user.id])
          .then(async (localCheck) => {
            if (localCheck.rows.length === 0) {
                await executeQuery(
                    `INSERT INTO v2_produtores (id, email, sync_status) VALUES (?, ?, ?)`,
                    [data.user.id, data.user.email, 'synced']
                );
            }
          }).catch(e => console.warn('[AuthService] sync v2_produtores failed:', e.message));

        // 5. NOVO: Salva credenciais para Biometria (v1.1.2)
        await safeSave('user_credentials_v1', { email, password });

        if (__DEV__) console.log('[AuthService] Login concluído com sucesso.');
        return { success: true, user: data.user };

    } catch (e) {
        if (__DEV__) console.error("LOGIN_FATAL_ERROR:", e);
        return { success: false, message: e.message || "Erro interno de autenticação" };
    }
};

/**
 * Autenticação por Biometria (Digital/Face)
 */
export const loginWithBiometrics = async () => {
    try {
        // 1. Verifica se o hardware suporta
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) throw new Error('Hardware de biometria não encontrado');

        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) throw new Error('Nenhuma biometria cadastrada no dispositivo');

        // 2. Solicita Autenticação
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Acesse o AgroGB com sua Digital',
            fallbackLabel: 'Usar Senha',
            disableDeviceFallback: false,
        });

        if (!result.success) return { success: false, message: 'Autenticação biométrica falhou' };

        // 3. Recupera credenciais salvas
        const creds = await safeGet('user_credentials_v1');
        if (!creds || !creds.email || !creds.password) {
            return { success: false, message: 'Por favor, faça login com senha uma vez antes de usar biometria.' };
        }

        // 4. Executa Login real (em background)
        return await login(creds.email, creds.password);

    } catch (e) {
        if (__DEV__) console.error("BIOMETRIC_LOGIN_ERROR:", e.message);
        return { success: false, message: e.message };
    }
};

// Mover promiseWithTimeout para cima (v1.1.5)

const checkSession = async () => {
    try {
        // 1. Tenta recuperar sessão local do SecureStore
        const localSession = await safeGet("user_session_v1");
        
        // 2. Sincroniza com Supabase Auth (Garante que o token não expirou)
        const sessionResult = await promiseWithTimeout(
            supabase.auth.getSession(),
            10000,
            "Timeout ao verificar sessão no servidor."
        );
        const { data: { session }, error } = sessionResult;
        
        if (error || !session) {
            if (localSession) {
                if (__DEV__) console.log('[AuthService] Sessão local expirada ou inválida no Supabase. Limpando...');
                await safeRemove("user_session_v1");
            }
            return null;
        }

        // 3. Se temos sessão no Supabase mas não local (ou vice-versa), harmoniza
        if (!localSession || localSession.userId !== session.user.id) {
            const newSession = {
                userId: session.user.id,
                email: session.user.email,
                token: session.access_token
            };
            await safeSave('user_session_v1', newSession);
            return newSession;
        }

        return localSession;
    } catch (e) {
        if (__DEV__) console.error('[AuthService] Erro crítico no checkSession (Timeout/Rede):', e.message);
        const localSession = await safeGet("user_session_v1");
        if (localSession) {
            if (__DEV__) console.log('[AuthService] Salvando sessão com base no cache local (Modo Offline).');
            return localSession;
        }
        return null;
    }
};

export const logout = async () => {
    try {
        if (__DEV__) console.log('[AuthService] Logging out...');
        await safeRemove("user_session_v1");
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
    loginWithBiometrics,
    logout,
    checkSession,
    requestPasswordReset
};
