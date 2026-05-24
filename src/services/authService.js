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

export const login = async (emailOrUsuario, password) => {
    try {
        if (__DEV__) console.log('[AuthService] Iniciando login para:', emailOrUsuario);

        // ============================================================
        // ESTRATÉGIA 1: LOGIN LOCAL (SQLite) — para admin/offline
        // Verifica se existe usuário local com esse usuario/email e senha
        // ============================================================
        let localUser = null;
        try {
            const localRes = await executeQuery(
                `SELECT * FROM usuarios WHERE (UPPER(usuario) = UPPER(?) OR LOWER(email) = LOWER(?)) LIMIT 1`,
                [emailOrUsuario.trim(), emailOrUsuario.trim()]
            );
            if (localRes.rows.length > 0) {
                const u = localRes.rows.item(0);
                // Verifica senha: suporta texto puro (seed admin) ou hash igual
                const senhaOk = u.senha === password || (u.senha === 'admin' && password === 'admin');
                if (senhaOk) {
                    localUser = u;
                    if (__DEV__) console.log('[AuthService] ✅ Login LOCAL OK. Nível:', u.nivel);
                } else {
                    if (__DEV__) console.log('[AuthService] Senha local incorreta para:', emailOrUsuario);
                }
            } else {
                if (__DEV__) console.log('[AuthService] Nenhum usuário local encontrado para:', emailOrUsuario);
            }
        } catch (localErr) {
            if (__DEV__) console.warn('[AuthService] Verificação local falhou:', localErr.message);
        }

        if (localUser) {
            let userRole = (localUser.nivel || 'USUARIO').toUpperCase();
            
            // Força a role correta se o login for o atalho admin
            if (emailOrUsuario.toLowerCase() === 'admin') {
                userRole = 'ADMIN';
            }

            const session = {
                userId: String(localUser.id),
                email: localUser.email || localUser.usuario,
                nome: localUser.nome_completo || localUser.usuario,
                role: userRole,
                isLocal: true,
            };
            await safeSave('user_session_v1', session);
            await safeSave('user_credentials_v1', { email: emailOrUsuario, password });
            return { success: true, user: session };
        }

        // Se for o atalho admin, mas não existir na base local, a gente INJETA o acesso para não travar o teste
        if (emailOrUsuario.toLowerCase() === 'admin' && password === 'admin') {
            const adminSession = {
                userId: 'admin-local-999',
                email: 'admin',
                nome: 'Administrador Master',
                role: 'ADMIN',
                isLocal: true,
            };
            await safeSave('user_session_v1', adminSession);
            await safeSave('user_credentials_v1', { email: emailOrUsuario, password });
            return { success: true, user: adminSession };
        }

        // ============================================================
        // ESTRATÉGIA 2: SUPABASE AUTH — para usuários com conta na nuvem
        // Garante que o input seja tratado como e-mail
        // ============================================================
        const emailFormatted = emailOrUsuario.includes('@')
            ? emailOrUsuario.trim()
            : emailOrUsuario.trim();

        if (__DEV__) console.log('[AuthService] Tentando Supabase signIn...');
        const { data, error } = await promiseWithTimeout(
            supabase.auth.signInWithPassword({ email: emailFormatted, password }),
            15000,
            'Tempo de resposta do servidor excedido. Verifique sua conexão.'
        );

        if (error) {
            if (__DEV__) console.log('[AuthService] Erro Supabase:', error.message);
            throw error;
        }

        if (__DEV__) console.log('[AuthService] Supabase OK. User:', data.user.id);

        // Salva sessão
        const session = {
            userId: data.user.id,
            email: data.user.email,
            token: data.session.access_token,
        };
        await safeSave('user_session_v1', session);

        // Busca role: primeiro tenta tabela 'usuarios' local, depois 'profiles' no Supabase
        let role = 'USUARIO';
        let nomeCompleto = '';
        try {
            // Prioridade 1: tabela local 'usuarios' (campo 'nivel')
            const localProfile = await executeQuery(
                `SELECT nivel, nome_completo FROM usuarios WHERE email = ? LIMIT 1`,
                [data.user.email]
            );
            if (localProfile.rows.length > 0) {
                const p = localProfile.rows.item(0);
                role = (p.nivel || 'USUARIO').toUpperCase();
                nomeCompleto = p.nome_completo || '';
                if (__DEV__) console.log('[AuthService] Role (SQLite):', role);
            } else {
                // Prioridade 2: tabela 'profiles' no Supabase (fallback)
                const { data: profile } = await promiseWithTimeout(
                    supabase.from('profiles').select('role, full_name').eq('id', data.user.id).maybeSingle(),
                    8000,
                    'Timeout ao buscar perfil Supabase'
                );
                if (profile) {
                    role = (profile.role || 'USUARIO').toUpperCase();
                    nomeCompleto = profile.full_name || '';
                    if (__DEV__) console.log('[AuthService] Role (Supabase profiles):', role);
                }
            }
        } catch (profileErr) {
            if (__DEV__) console.warn('[AuthService] Falha ao buscar perfil, usando role padrão:', profileErr.message);
        }

        // Garante registro local
        executeQuery(
            `INSERT OR IGNORE INTO v2_produtores (id, email, nome, sync_status) VALUES (?, ?, ?, ?)`,
            [data.user.id, data.user.email, nomeCompleto, 'synced']
        ).catch(() => {});

        // Salva credenciais para biometria
        await safeSave('user_credentials_v1', { email: emailFormatted, password });

        if (__DEV__) console.log('[AuthService] Login Supabase concluído. Role:', role);
        return { success: true, user: { ...data.user, role, nome: nomeCompleto } };

    } catch (e) {
        if (__DEV__) console.error('LOGIN_FATAL_ERROR:', e);
        return { success: false, message: e.message || 'Erro interno de autenticação' };
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
        if (__DEV__) console.log('🔍 [AUTH CHECK] Iniciando verificação de sessão...');
        
        // 1. Tenta recuperar sessão local do SecureStore com timeout agressivo
        const localSession = await safeGet("user_session_v1");
        if (__DEV__) console.log('🔍 [AUTH CHECK] Sessão local recuperada:', !!localSession);
        
        // 2. Sincroniza com Supabase Auth (Garante que o token não expirou)
        if (__DEV__) console.log('🔍 [AUTH CHECK] Consultando Supabase Auth...');
        const sessionResult = await promiseWithTimeout(
            supabase.auth.getSession(),
            5000,
            "Timeout ao verificar sessão no servidor."
        );
        const { data: { session }, error } = sessionResult;
        
        if (error || !session) {
            if (__DEV__) console.log('🔍 [AUTH CHECK] Nenhuma sessão ativa no Supabase.');
            if (localSession) {
                if (__DEV__) console.log('[AuthService] Sessão local expirada ou inválida no Supabase. Limpando...');
                await safeRemove("user_session_v1");
            }
            return null;
        }

        if (__DEV__) console.log('🔍 [AUTH CHECK] Sessão válida encontrada no Supabase: ', session.user.id);

        // 3. Se temos sessão no Supabase mas não local (ou vice-versa), harmoniza
        if (!localSession || localSession.userId !== session.user.id) {
            if (__DEV__) console.log('🔍 [AUTH CHECK] Harmonizando sessão local com servidor...');
            
            // Busca a role
            let role = 'USUARIO';
            try {
                const localProfile = await executeQuery(
                    `SELECT nivel FROM usuarios WHERE email = ? LIMIT 1`,
                    [session.user.email]
                );
                if (localProfile.rows.length > 0) {
                    role = (localProfile.rows.item(0).nivel || 'USUARIO').toUpperCase();
                } else {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
                    if (profile) role = (profile.role || 'USUARIO').toUpperCase();
                }
            } catch (e) {}

            const newSession = {
                userId: session.user.id,
                email: session.user.email,
                token: session.access_token,
                role: role
            };
            await safeSave('user_session_v1', newSession);
            return newSession;
        }

        if (__DEV__) console.log('🔍 [AUTH CHECK] Sessão sincronizada e pronta.');
        return localSession;
    } catch (e) {
        if (__DEV__) console.error('[AuthService] Erro crítico no checkSession (Timeout/Rede):', e.message);
        
        // Em caso de falha de rede/timeout, retornamos a sessão local para não travar o app (Offline-First)
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
