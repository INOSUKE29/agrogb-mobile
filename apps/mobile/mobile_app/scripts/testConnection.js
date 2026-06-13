// testConnection.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Supabase URL ou Chave não configurada no ambiente.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        console.log('🔄 Testando conexão com Supabase...');
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            console.error('❌ Erro na conexão:', error.message);
        } else {
            console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        }
    } catch (e) {
        console.error('❌ Erro inesperado:', e);
    }
}

testConnection();
