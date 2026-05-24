import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userSession, setUserSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await AuthService.checkSession();
                setUserSession(session);
            } catch (e) {
                console.error("AuthContext erro:", e);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setUserSession(prev => session ? {
                    ...prev,
                    userId: session.user.id,
                    email: session.user.email,
                    token: session.access_token
                } : null);
            } else if (event === 'SIGNED_OUT') {
                setUserSession(null);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ userSession, setUserSession, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
