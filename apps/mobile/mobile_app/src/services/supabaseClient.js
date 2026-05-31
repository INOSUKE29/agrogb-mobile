import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto'; // Required for Supabase in React Native

// Configuração via variáveis de ambiente (arquivo .env) com fallbacks de segurança
// Estes valores garantem que o APK funcione mesmo que o ambiente de build falhe em injetar as chaves
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uklygrvibmiknwarzqap.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHlncnZpYm1pa253YXJ6cWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDcyODgsImV4cCI6MjA4NjM4MzI4OH0.aY-R2vzuTzUNbjy1iGmMleikxHOT8MAtL82Rpm5q6ac';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

/**
 * Singleton Supabase Client Helper
 */
export const getSupabase = () => supabase;

/**
 * Testa se o servidor Supabase está acessível
 */
export const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('usuarios').select('id').limit(1);
        if (error) throw error;
        return true;
    } catch (e) {
        if (__DEV__) console.log('[Supabase] Erro de Conexão:', e.message);
        return false;
    }
};

if (__DEV__) {
    console.log('[SupabaseClient] Configurado com URL:', SUPABASE_URL);
    console.log('[SupabaseClient] Chave Anon (fragmento):', 
        SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 6)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 4)}` : 'NULL'
    );
}
