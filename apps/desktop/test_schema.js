import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
    console.log("Checking v2_talhoes...");
    const t = await supabase.from('v2_talhoes').select('*').limit(1);
    console.log("v2_talhoes:", t.error ? t.error.message : (t.data.length ? Object.keys(t.data[0]) : 'Empty, but table exists'));

    console.log("\nChecking v2_estoque_atual...");
    const e = await supabase.from('v2_estoque_atual').select('*').limit(1);
    console.log("v2_estoque_atual:", e.error ? e.error.message : (e.data.length ? Object.keys(e.data[0]) : 'Empty, but table exists'));

    console.log("\nChecking v2_produtos...");
    const p = await supabase.from('v2_produtos').select('*').limit(1);
    console.log("v2_produtos:", p.error ? p.error.message : (p.data.length ? Object.keys(p.data[0]) : 'Empty, but table exists'));

    console.log("\nChecking v2_maquinas...");
    const m = await supabase.from('v2_maquinas').select('*').limit(1);
    console.log("v2_maquinas:", m.error ? m.error.message : (m.data.length ? Object.keys(m.data[0]) : 'Empty, but table exists'));
}

checkTables();
