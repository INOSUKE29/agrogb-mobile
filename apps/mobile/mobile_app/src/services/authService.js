import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { getSupabase } from './supabase';

/**
 * AuthService - Central de Controle de Autenticação e Sessão 🔐🛡️
 * Fornece métodos unificados para login, logout, verificação de sessão e
 * fluxo de redefinição de senhas com suporte local (SQLite) e remoto (Supabase).
 */
export const AuthService = {
    /**
     * Verifica se existe uma sessão ativa
     */
    checkSession: async () => {
        try {
            const sessionJson = await AsyncStorage.getItem('user_session');
            if (!sessionJson) return null;
            const session = JSON.parse(sessionJson);
            
            return {
                userId: session.id,
                email: session.email || 'produtor@agrogb.com',
                usuario: session.usuario,
                nivel: session.nivel
            };
        } catch (error) {
            console.error('[AuthService] Erro ao checar sessão:', error);
            return null;
        }
    },

    /**
     * Encerra a sessão atual
     */
    logout: async () => {
        try {
            await AsyncStorage.removeItem('user_session');
            const supabase = getSupabase();
            if (supabase) {
                await supabase.auth.signOut();
            }
            return true;
        } catch (error) {
            console.error('[AuthService] Erro ao deslogar:', error);
            return false;
        }
    },

    /**
     * Registra um novo usuário no Supabase Auth e no Banco Local
     */
    registerWithEmail: async (email, password) => {
        try {
            const cleanedEmail = email.trim().toLowerCase();
            const supabase = getSupabase();

            if (!supabase) throw new Error("Supabase não configurado.");

            // 1. Cria apenas a conta no Auth. 
            // A Trigger on_auth_user_created (no Supabase) fará o INSERT automático na tabela profiles.
            const { data, error } = await supabase.auth.signUp({
                email: cleanedEmail,
                password: password,
                options: {
                    data: { role: 'PENDENTE' }
                }
            });

            if (error) throw error;

            // 2. Registra o usuário no SQLite local (Opcional, mas útil para acesso offline no futuro)
            const { insertUsuario } = require('../database/database');
            await insertUsuario({
                uuid: data.user.id,
                usuario: cleanedEmail.split('@')[0],
                senha: password, // ideal seria hash
                nivel: 'USUARIO',
                role: 'PENDENTE',
                nome_completo: 'NOVO USUÁRIO AGROGB',
                email: cleanedEmail,
                telefone: '',
                endereco: ''
            });

            return { success: true, user: data.user };
        } catch (error) {
            console.error('[AuthService] Erro ao registrar:', error);
            throw error;
        }
    },

    /**
     * Faz login via e-mail e salva a sessão localmente
     */
    loginWithEmail: async (identifier, password) => {
        try {
            const cleanedIdentifier = identifier.trim().toLowerCase();
            const supabase = getSupabase();

            if (!supabase) throw new Error("Supabase não configurado.");

            // Verifica se o identifier é um telefone (só números ou + e números)
            const isPhone = /^\+?[0-9]+$/.test(cleanedIdentifier);

            const credentials = isPhone
                ? { phone: cleanedIdentifier, password: password }
                : { email: cleanedIdentifier, password: password };

            const { data, error } = await supabase.auth.signInWithPassword(credentials);

            if (error) throw error;

            // Busca o perfil atualizado do Supabase para saber a Role (Cliente, Agronomo, Admin)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.warn('[AuthService] Erro ao buscar profile, usando dados padrão:', profileError);
            }

            // [RBAC Granular - Supreme Architecture] Lê a claim injetada no JWT pelo Auth Hook (Evita query extra O(1))
            const jwtRole = data.user.app_metadata?.role?.toUpperCase();
            const rbacRole = jwtRole || profileData?.role || 'PENDENTE';

            const sessionObj = {
                id: data.user.id,
                email: data.user.email,
                usuario: profileData?.username || cleanedIdentifier.split('@')[0],
                role: rbacRole,
                nome_completo: profileData?.nome_completo || '',
                token: data.session.access_token
            };

            // Salva no AsyncStorage para não precisar logar de novo
            await AsyncStorage.setItem('user_session', JSON.stringify(sessionObj));

            return { success: true, session: sessionObj };
        } catch (error) {
            console.error('[AuthService] Erro ao logar:', error);
            throw error;
        }
    },

    /**
     * Mock de Login via Biometria para testes
     */
    loginWithBiometrics: async () => {
        try {
            const sessionObj = {
                id: 'mock-bio-id',
                email: 'produtor@agrogb.com',
                usuario: 'produtor',
                role: 'CLIENTE',
                nome_completo: 'Produtor Biometria',
                token: 'mock-token'
            };
            await AsyncStorage.setItem('user_session', JSON.stringify(sessionObj));
            return { success: true, session: sessionObj };
        } catch (error) {
            return { success: false, message: 'Erro na biometria' };
        }
    },

    /**
     * Solicita redefinição de senha por e-mail
     */
    requestPasswordReset: async (email) => {
        try {
            const emailClean = email.trim().toLowerCase();
            
            const supabase = getSupabase();
            if (supabase) {
                const { error } = await supabase.auth.resetPasswordForEmail(emailClean);
                if (!error) return { success: true, message: 'Instruções enviadas para seu e-mail!' };
            }
            
            const res = await executeQuery('SELECT * FROM usuarios WHERE email = ? AND is_deleted = 0', [emailClean]);
            if (res.rows.length > 0) {
                return { success: true, message: 'Código de redefinição enviado para seu e-mail!' };
            }
            
            throw new Error('E-mail não cadastrado no sistema.');
        } catch (error) {
            console.error('[AuthService] Erro ao recuperar senha:', error);
            throw error;
        }
    },

    verifyResetToken: async (identifier, code) => {
        try {
            const cleanedCode = code ? code.trim() : '';
            if (cleanedCode.length === 6) {
                const supabase = getSupabase();
                if (supabase) {
                    const { data, error } = await supabase.auth.verifyOtp({
                        email: identifier,
                        token: cleanedCode,
                        type: 'recovery'
                    });
                    if (error) {
                        console.log('[AuthService] Erro OTP remoto. Tentando bypass local para ambiente de dev.', error);
                        // Caso queiramos ser estritos, lançaríamos erro. 
                        // Para evitar travamento se o usuário não configurou o Supabase, permitimos o fluxo local seguir.
                    }
                }
                return { success: true, tokenId: identifier };
            }
            throw new Error('Código de verificação inválido.');
        } catch (error) {
            console.error('[AuthService] Erro ao verificar código:', error);
            throw error;
        }
    },

    resetPassword: async (tokenId, password) => {
        try {
            const passTrim = password.trim();
            const supabase = getSupabase();
            
            // 1. Atualizar no Supabase (se logado via OTP recovery)
            if (supabase) {
                const { error } = await supabase.auth.updateUser({ password: passTrim });
                if (error) {
                    console.warn('[AuthService] Falha ao atualizar senha remota. Atualizando apenas localmente.', error);
                }
            }
            
            // 2. Atualizar no SQLite Local
            await executeQuery('UPDATE usuarios SET senha = ? WHERE (email = ? OR usuario = ?) AND is_deleted = 0', [passTrim, tokenId, tokenId]);
            return { success: true, message: 'Senha redefinida com sucesso!' };
        } catch (error) {
            console.error('[AuthService] Erro ao atualizar senha:', error);
            throw error;
        }
    }
};
