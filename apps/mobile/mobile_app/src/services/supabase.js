
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { executeQuery } from '../database/database';

// ⚠️ CHAVES REAIS DO SUPABASE (RECUPERADAS HISTORICAMENTE) ⚠️
const SUPABASE_URL = 'https://uklygrvibmiknwarzqap.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6e3KZkbHgcfd_-xaOeIBLA_2AJeN9Ew';

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

// 🗺️ TRADUTOR DE ARQUITETURA V2 (Desktop ↔ Mobile)
const V2_TABLE_MAP = {
    'clientes': 'v2_clientes',
    'culturas': 'v2_culturas',
    'products': 'v2_produtos',
    'vendas': 'v2_encomendas',
    'custos': 'v2_custos',
};

// Sincronização Bidirecional via Outbox
export const processOutbox = async () => {
    const supabase = getSupabase();
    
    // Pega itens da fila de postagem cronologicamente (limite de batching para não estourar)
    const outboxRes = await executeQuery("SELECT * FROM sync_outbox WHERE status = 'PENDENTE' ORDER BY criado_em ASC LIMIT 50");
    const outbox = [];
    for (let i = 0; i < outboxRes.rows.length; i++) outbox.push(outboxRes.rows.item(i));

    if (outbox.length === 0) return;

    for (const item of outbox) {
        try {
            // Busca o payload mais atual direto da tabela afetada usando o UUID do evento
            const resData = await executeQuery(`SELECT * FROM ${item.tabela} WHERE uuid = ?`, [item.registro_uuid]);
            if (resData.rows.length > 0) {
                const row = resData.rows.item(0);
                const { id, sync_status, ...cleanRow } = row;
                
                // 🔄 Interceptador V2
                const cloudTable = V2_TABLE_MAP[item.tabela] || item.tabela;
                const { error } = await supabase.from(cloudTable).upsert([cleanRow], { onConflict: 'uuid' });

                if (!error) {
                    await executeQuery(`UPDATE sync_outbox SET status = 'CONCLUIDO' WHERE uuid = ?`, [item.uuid]);
                    await executeQuery(`UPDATE ${item.tabela} SET sync_status = 1 WHERE uuid = ?`, [item.registro_uuid]);
                } else {
                    console.log(`⚠️ Aviso Fila (PostgREST Error):`, error);
                    await executeQuery("UPDATE sync_outbox SET tentativas = tentativas + 1 WHERE uuid = ?", [item.uuid]);
                }
            } else {
                // Registro não existe mais (pode ter sido hard deleted antes do envio).
                // Como usamos soft delete (is_deleted = 1), isso não deve ocorrer, mas limpamos o outbox por precaução.
                await executeQuery(`UPDATE sync_outbox SET status = 'CANCELADO_ORFÃO' WHERE uuid = ?`, [item.uuid]);
            }
        } catch (netErr) {
            console.log(`📡 Falha de Rede na Fila:`, netErr.message || netErr);
            break; // Se falhou a rede, pausa o processamento da fila para respeitar ordem
        }
    }
};

export const syncTable = async (tableName) => {
    const supabase = getSupabase();

    // 2. PULL: Baixa dados novos da nuvem
    try {
        const resLast = await executeQuery(`SELECT MAX(last_updated) as max_date FROM ${tableName}`);
        const lastDate = resLast.rows.item(0).max_date || '1970-01-01T00:00:00.000Z';

        // 🔄 Interceptador V2
        const cloudTable = V2_TABLE_MAP[tableName] || tableName;

        const { data, error } = await supabase
            .from(cloudTable)
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
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        return !error;
    } catch (e) {
        return false;
    }
};
