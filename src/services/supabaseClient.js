import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto'; // Required for Supabase in React Native

// Substitua ou configure via variáveis de ambiente
const SUPABASE_URL = 'https://uklygrvibmiknwarzqap.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6e3KZkbHgcfd_-xaOeIBLA_2AJeN9Ew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

if (__DEV__) {
    console.log('[SupabaseClient] Configurado com URL:', SUPABASE_URL);
    console.log('[SupabaseClient] Chave Anon (fragmento):', 
        SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 6)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 4)}` : 'NULL'
    );
}
