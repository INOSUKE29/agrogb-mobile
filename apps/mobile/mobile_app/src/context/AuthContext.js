import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/authService';

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
                setUser(JSON.parse(session));
            }
        } catch (e) {
            console.error(e);
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
