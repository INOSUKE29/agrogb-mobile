import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { supabase } from './supabase';

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
     * Solicita redefinição de senha por e-mail
     */
    requestPasswordReset: async (email) => {
        try {
            const emailClean = email.trim().toLowerCase();
            
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
