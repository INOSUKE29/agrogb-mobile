import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const syncData = async () => {
    try {
        log('Syncing...');
        return true;
    } catch { return false; }
};

const log = (m) => console.log(`[Supabase] ${m}`);
