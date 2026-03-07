
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { executeQuery } from '../database/database';

// ⚠️ CHAVES REAIS DO SUPABASE ⚠️
const SUPABASE_URL = 'https://uklygrvibmiknwarzqap.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6e3KZkbHgcfd_-xaOeIBLA_2AJeN9Ew';

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

// ============================================================
// MAPEAMENTO DE TABELAS (LOCAL vs SUPABASE MASTER)
// ============================================================
const TABLE_MAP = {
    'usuarios': 'users',
    'culturas': 'areas',
    'cadastro': 'items',
    'clientes': 'clientes',
    'colheitas': 'colheitas',
    'vendas': 'vendas',
    'estoque': 'estoque',
    'movimentacao_estoque': 'movimentos_estoque'
};

// ============================================================
// SYNC MASTER BIDIRECIONAL
// ============================================================
export const syncTableMaster = async (localTable) => {
    const supabase = getSupabase();
    const remoteTable = TABLE_MAP[localTable] || localTable;

    console.log(`🔄 Iniciando Sync Master: ${localTable} -> ${remoteTable}`);

    // ── 1. PUSH (Local -> Cloud) ──────────────────────────────
    try {
        const res = await executeQuery(`SELECT * FROM ${localTable} WHERE sync_status = 0`);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));

        if (rows.length > 0) {
            // Mapear campos locais para os campos do Supabase se necessário
            const cleanRows = rows.map(r => {
                const { id, sync_status, ...rest } = r;
                // Ajustes específicos de campo podem entrar aqui
                if (localTable === 'culturas') {
                    return { ...rest, uuid: r.uuid };
                }
                return rest;
            });

            const { error } = await supabase.from(remoteTable).upsert(cleanRows, { onConflict: 'uuid' });

            if (!error) {
                for (const row of rows) {
                    await executeQuery(`UPDATE ${localTable} SET sync_status = 1 WHERE uuid = ?`, [row.uuid]);
                }
                console.log(`✅ PUSH ${remoteTable}: ${rows.length} registros enviados`);
            } else {
                console.warn(`⚠️ Erro PUSH ${remoteTable}:`, error.message);
            }
        }
    } catch (e) {
        console.log(`📡 Falha PUSH ${localTable}:`, e.message);
    }

    // ── 2. PULL (Cloud -> Local) ──────────────────────────────
    try {
        const resLast = await executeQuery(`SELECT MAX(last_updated) as max_date FROM ${localTable}`);
        const lastDate = resLast.rows.item(0).max_date || '1970-01-01T00:00:00.000Z';

        const { data, error } = await supabase
            .from(remoteTable)
            .select('*')
            .gt('last_updated', lastDate);

        if (error) {
            console.warn(`⚠️ Erro PULL ${remoteTable}:`, error.message);
            return;
        }

        if (data && data.length > 0) {
            console.log(`📥 PULL ${remoteTable}: ${data.length} registros recebidos`);
            for (const item of data) {
                await upsertLocalMaster(localTable, item);
            }
        }
    } catch (e) {
        console.log(`📡 Falha PULL ${localTable}:`, e.message);
    }
};

// ── INSERT OR REPLACE genérico no SQLite local ───────────────
const upsertLocalMaster = async (localTable, item) => {
    try {
        // Remove campos que não existem no banco local se houver divergência
        const { id, ...cleanItem } = item;
        const keys = Object.keys(cleanItem);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => cleanItem[k]);

        await executeQuery(
            `INSERT OR REPLACE INTO ${localTable} (${keys.join(', ')}, sync_status)
             VALUES (${placeholders}, 1)`,
            values
        );
    } catch (e) {
        console.warn(`⚠️ Erro Upsert ${localTable}:`, e.message);
    }
};

// ============================================================
// SYNC COMPLETO MASTER
// =============================================
export const syncAllMaster = async () => {
    console.log('🚀 Sincronização MASTER iniciada...');
    const tables = Object.keys(TABLE_MAP);
    let successCount = 0;

    for (const table of tables) {
        try {
            await syncTableMaster(table);
            successCount++;
        } catch (e) {
            console.error('[API ERROR]', e);
        }
    }

    console.log(`🏁 Sincronização MASTER concluída: ${successCount}/${tables.length} tabelas processadas.`);
    return successCount;
};

export const testConnection = async () => {
    try {
        const supabase = getSupabase();
        // Testa com a nova tabela 'users' do Master
        const { error } = await supabase.from('users').select('id').limit(1);
        return !error;
    } catch (e) {
        return false;
    }
};
