import { createClient } from '@supabase/supabase-js';

// URL e Key extraídos do supabase.ts da Desktop
const supabaseUrl = 'https://uklygrvibmiknwarzqap.supabase.co';
const supabaseKey = 'sb_publishable_6e3KZkbHgcfd_-xaOeIBLA_2AJeN9Ew';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log("Verificando conexão com o Supabase...");
    
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
        console.error("ERRO:", error.message);
    } else {
        console.log("SUCESSO: A tabela 'profiles' existe!", data);
    }
}

checkDatabase();
