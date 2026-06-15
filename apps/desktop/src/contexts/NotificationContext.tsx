import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    is_read: boolean;
    link?: string;
    created_at: string;
}

interface NotificationContextData {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        if (!user) return;

        // Fetch Initial Notifications
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('v2_notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                setNotifications(data as AppNotification[]);
            }
        };

        fetchNotifications();

        // Subscribe to Realtime Insertions/Updates
        const subscription = supabase
            .channel('public:v2_notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'v2_notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new as AppNotification;
                        setNotifications(prev => [newNotif, ...prev]);
                        toast(newNotif.title, {
                            icon: newNotif.type === 'success' ? '✅' : newNotif.type === 'error' ? '❌' : newNotif.type === 'warning' ? '⚠️' : 'ℹ️',
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotif = payload.new as AppNotification;
                        setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        // Optimistic UI
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        await supabase.from('v2_notifications').update({ is_read: true }).eq('id', id);
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic UI
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        await supabase.from('v2_notifications').update({ is_read: true }).in('id', unreadIds);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    return useContext(NotificationContext);
};
