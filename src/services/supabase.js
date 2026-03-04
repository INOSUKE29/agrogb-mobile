
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { executeQuery } from '../database/database';

// ⚠️ CHAVES REAIS DO SUPABASE ⚠️
const SUPABASE_URL = 'https://bybryyvmwkahoohgtmpc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QdNitBVoMJmfgG7vE4cPUg_bIwVA7sn';

let supabaseInstance = null;

export const getSupabase = () => {
    if (!supabaseInstance) {
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                storage: null,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
    }
    return supabaseInstance;
};

// ============================================================
// SYNC BIDIRECIONAL COMPLETO
// 1. PUSH: envia dados locais pendentes (sync_status=0) para o Supabase
// 2. PULL: baixa registros novos da nuvem e salva no SQLite local
// ============================================================
export const syncTable = async (tableName) => {
    const supabase = getSupabase();

    // ── 1. PUSH ──────────────────────────────────────────────
    try {
        const res = await executeQuery(`SELECT * FROM ${tableName} WHERE sync_status = 0`);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));

        if (rows.length > 0) {
            const cleanRows = rows.map(r => {
                const { id, sync_status, ...rest } = r;
                return rest;
            });

            const { error } = await supabase.from(tableName).upsert(cleanRows, { onConflict: 'uuid' });

            if (!error) {
                for (const row of rows) {
                    await executeQuery(`UPDATE ${tableName} SET sync_status = 1 WHERE uuid = ?`, [row.uuid]);
                }
                console.log(`✅ PUSH ${tableName}: ${rows.length} registros enviados`);
            } else {
                console.log(`⚠️ Erro PUSH ${tableName}:`, error.message);
            }
        }
    } catch (e) {
        console.log(`📡 Falha de rede PUSH ${tableName}:`, e.message || e);
    }

    // ── 2. PULL ──────────────────────────────────────────────
    try {
        // Busca a data do registro mais recente que temos localmente
        const resLast = await executeQuery(`SELECT MAX(last_updated) as max_date FROM ${tableName}`);
        const lastDate = resLast.rows.item(0).max_date || '1970-01-01T00:00:00.000Z';

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .gt('last_updated', lastDate);

        if (error) { console.log(`⚠️ Erro PULL ${tableName}:`, error.message); return; }

        if (data && data.length > 0) {
            console.log(`📥 PULL ${tableName}: ${data.length} registros recebidos`);
            for (const item of data) {
                await upsertLocal(tableName, item);
            }
        }
    } catch (e) {
        console.log(`📡 Falha de rede PULL ${tableName}:`, e.message || e);
    }
};

// ── INSERT OR REPLACE genérico no SQLite local ───────────────
const upsertLocal = async (tableName, item) => {
    try {
        const keys = Object.keys(item);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => item[k]);

        // Tenta INSERT OR REPLACE (funciona quando há UNIQUE uuid)
        await executeQuery(
            `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}, sync_status)
             VALUES (${placeholders}, 1)`,
            values
        );
    } catch (e) {
        // Se falhar (ex: coluna não existe ainda), tenta UPDATE
        try {
            if (!item.uuid) return;
            const sets = Object.keys(item).filter(k => k !== 'uuid').map(k => `${k} = ?`).join(', ');
            const vals = Object.keys(item).filter(k => k !== 'uuid').map(k => item[k]);
            await executeQuery(
                `UPDATE ${tableName} SET ${sets}, sync_status = 1 WHERE uuid = ?`,
                [...vals, item.uuid]
            );
        } catch (e2) { /* ignora */ }
    }
};

// ============================================================
// SYNC COMPLETO — todas as tabelas de uma vez
// ============================================================
const SYNC_TABLES = [
    'colheitas', 'vendas', 'compras', 'plantio', 'custos',
    'descarte', 'clientes', 'culturas', 'cadastro', 'maquinas',
    'manutencao_frota', 'monitoramento_entidade', 'monitoramento_media',
    'planos_adubacao', 'caderno_notas'
];

export const syncAll = async () => {
    console.log('🔄 Sincronização automática iniciada...');
    let success = 0;
    for (const table of SYNC_TABLES) {
        try {
            await syncTable(table);
            success++;
        } catch (e) { /* continua para próxima tabela */ }
    }
    console.log(`✅ Sync completo: ${success}/${SYNC_TABLES.length} tabelas`);
    return success;
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
