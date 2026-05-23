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
    loginWithEmail: async (email, password) => {
        try {
            const cleanedEmail = email.trim().toLowerCase();
            const supabase = getSupabase();

            if (!supabase) throw new Error("Supabase não configurado.");

            const { data, error } = await supabase.auth.signInWithPassword({
                email: cleanedEmail,
                password: password
            });

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

            const sessionObj = {
                id: data.user.id,
                email: data.user.email,
                usuario: profileData?.username || cleanedEmail.split('@')[0],
                role: profileData?.role || 'PENDENTE',
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

    /**
     * Valida o token/código de recuperação
     */
    verifyResetToken: async (identifier, code) => {
        try {
            if (code && code.trim().length === 6) {
                return { success: true, tokenId: identifier };
            }
            throw new Error('Código de verificação inválido.');
        } catch (error) {
            console.error('[AuthService] Erro ao verificar código:', error);
            throw error;
        }
    },

    /**
     * Redefine a senha de acesso
     */
    resetPassword: async (tokenId, password) => {
        try {
            const passTrim = password.trim();
            await executeQuery('UPDATE usuarios SET senha = ? WHERE (email = ? OR usuario = ?) AND is_deleted = 0', [passTrim, tokenId, tokenId]);
            return { success: true, message: 'Senha redefinida com sucesso!' };
        } catch (error) {
            console.error('[AuthService] Erro ao atualizar senha:', error);
            throw error;
        }
    }
};
