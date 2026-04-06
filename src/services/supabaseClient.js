import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto'; // Required for Supabase in React Native

// Configuração via variáveis de ambiente (arquivo .env)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
