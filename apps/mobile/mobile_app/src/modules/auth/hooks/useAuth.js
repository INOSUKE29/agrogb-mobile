import { useState, useCallback } from 'react';
import { AuthService } from '../services/AuthService';

/**
 * useAuth Hook (V1.1 DIAMOND PRO) 💎
 * Facilita o uso da autenticação nas telas. 🚀
 */
export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await AuthService.login(email, password);
            if (!res.success) setError(res.message);
            return res;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await AuthService.logout();
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        login,
        logout,
        loading,
        error
    };
}
