/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    role: string | null;
    permissions: string[];
    loading: boolean;
    signOut: () => Promise<void>;
    hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    permissions: [],
    loading: true,
    signOut: async () => {},
    hasPermission: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoleAndPermissions = async (userId: string) => {
        try {
            setRole(null);
            setPermissions([]);
            
            // 1. Fallback: Busca o role base da tabela profiles (Legado/Interface Base)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            
            if (profileData) {
                setRole(profileData.role);
            }

            // 2. Novo Motor: Busca as permissões granulares
            const { data: rolesData, error } = await supabase
                .from('user_roles')
                .select(`
                    roles (
                        name,
                        role_permissions (
                            permissions ( name )
                        )
                    )
                `)
                .eq('user_id', userId);
            
            if (!error && rolesData) {
                const perms = new Set<string>();
                rolesData.forEach((ur: any) => {
                    const roleNode = ur.roles;
                    if (roleNode && roleNode.role_permissions) {
                        roleNode.role_permissions.forEach((rp: any) => {
                            if (rp.permissions && rp.permissions.name) {
                                perms.add(rp.permissions.name);
                            }
                        });
                    }
                });
                setPermissions(Array.from(perms));
            }
        } catch (error) {
            console.error('Error fetching role/permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            if (session?.user) {
                fetchRoleAndPermissions(session.user.id);
            } else {
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                fetchRoleAndPermissions(session.user.id);
            } else {
                setRole(null);
                setPermissions([]);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const hasPermission = (perm: string) => {
        if (role === 'ADMIN') return true;
        return permissions.includes(perm);
    };

    return (
        <AuthContext.Provider value={{ user, role, permissions, loading, signOut: async () => await supabase.auth.signOut(), hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
