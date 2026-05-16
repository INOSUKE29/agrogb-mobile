
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { executeQuery } from '../database/database';

// ⚠️ CHAVES REAIS DO SUPABASE ⚠️
const SUPABASE_URL = 'https://bybryyvmwkahoohgtmpc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QdNitBVoMJmfgG7vE4cPUg_bIwVA7sn';

let supabaseInstance = null;

export const getSupabase = () => {
    if (!supabaseInstance) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                storage: AsyncStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
    }
    return supabaseInstance;
};

// Sincronização Bidirecional
export const syncTable = async (tableName) => {
    const supabase = getSupabase();

    // 1. PUSH: Envia dados locais pendentes (sync_status = 0)
    try {
        const res = await executeQuery(`SELECT * FROM ${tableName} WHERE sync_status = 0`);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));

        if (rows.length > 0) {
            // Remove campos locais antes de enviar (id, sync_status)
            const cleanRows = rows.map(r => {
                const { id, sync_status, ...rest } = r;
                return rest;
            });

            try {
                const { error } = await supabase.from(tableName).upsert(cleanRows, { onConflict: 'uuid' });

                if (!error) {
                    // Marca como sincronizado localmente
                    for (const row of rows) {
                        await executeQuery(`UPDATE ${tableName} SET sync_status = 1 WHERE uuid = ?`, [row.uuid]);
                    }
                } else {
                    console.log(`⚠️ Aviso envio ${tableName} (PostgREST Error):`, error);
                }
            } catch (netErr) {
                console.log(`📡 Falha de Rede no Envio de ${tableName}:`, netErr.message || netErr);
            }
        }
    } catch (e) { console.log(`⚠️ Aviso local ${tableName}:`, e.message || e); }

    // 2. PULL: Baixa dados novos da nuvem
    try {
        const resLast = await executeQuery(`SELECT MAX(last_updated) as max_date FROM ${tableName}`);
        const lastDate = resLast.rows.item(0).max_date || '1970-01-01T00:00:00.000Z';

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .gt('last_updated', lastDate);

        if (data && data.length > 0) {
            const { genericUpsert } = require('../database/database');
            for (const item of data) {
                // Marca como sincronizado ao salvar localmente
                await genericUpsert(tableName, { ...item, sync_status: 1 });
            }
            console.log(`📥 Sincronizados ${data.length} registros de ${tableName}`);
        }
    } catch (e) { 
        console.log(`❌ Erro no Pull de ${tableName}:`, e.message);
    }
};

export const testConnection = async () => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.from('usuarios').select('count').limit(1);
        return !error;
    } catch (e) {
        return false;
    }
};
