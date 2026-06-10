import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/authService';
import { getSupabase } from '../services/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const session = await AsyncStorage.getItem('user_session');
            if (session) {
                try {
                    const parsedSession = JSON.parse(session);
                    if (parsedSession && parsedSession.id) {
                        // --- INÍCIO: CORREÇÃO AUDITORIA SESSÃO ZUMBI ---
                        try {
                            const supabase = getSupabase();
                            if (supabase && parsedSession.token) {
                                const { error } = await supabase.auth.getUser(parsedSession.token);
                                
                                if (error) {
                                    // Erros 401/403 ou tokens inválidos forçam o logout
                                    if (error.status === 401 || error.message.includes('Auth session') || error.message.includes('JWT') || error.message.includes('expired')) {
                                        console.warn('[AGROGB BOOT] Token Supabase expirado/inválido. Expulsando sessão Zumbi.');
                                        await logout();
                                        setLoading(false);
                                        return;
                                    }
                                    console.log('[AGROGB BOOT] Supabase inacessível (Offline Mode).', error.message);
                                }
                            }
                        } catch (netErr) {
                            console.log('[AGROGB BOOT] Sem internet para validar JWT. Iniciando offline-first.');
                        }
                        // --- FIM: CORREÇÃO AUDITORIA SESSÃO ZUMBI ---
                        
                        console.log('[AGROGB BOOT] Sessão validada e ativa.');
                        setUser(parsedSession);
                    } else {
                        console.warn('[AGROGB BOOT] Sessão incompleta. Limpando...');
                        await logout();
                    }
                } catch (parseError) {
                    // Corrupção do arquivo JSON no AsyncStorage
                    console.error('Sessão corrompida detectada, limpando...', parseError);
                    await logout();
                }
            }
        } catch (e) {
            console.error('Erro ao acessar o AsyncStorage', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user_session', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            setUser(null);
            await AuthService.logout();
        } catch(e) { console.error(e); }
    };

    const role = user?.role || (user?.nivel === 'ADM' ? 'ADMIN' : (user?.nivel === 'AGRONOMO' ? 'AGRONOMO' : (user?.nivel === 'STAFF' ? 'STAFF' : 'AGRICULTOR')));

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, role }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
