import { supabase } from './supabaseClient';
import { executeQuery, getAppSettings } from '../database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const syncTables = [
    { name: 'usuarios', pk: 'id' },
    { name: 'colheitas', pk: 'uuid' },
    { name: 'monitoramento_entidade', pk: 'uuid' },
    { name: 'vendas', pk: 'uuid' },
    { name: 'compras', pk: 'uuid' },
    { name: 'plantio', pk: 'uuid' },
    { name: 'custos', pk: 'uuid' },
    { name: 'descarte', pk: 'uuid' },
    { name: 'cadastro', pk: 'uuid' },
    { name: 'clientes', pk: 'uuid' },
    { name: 'culturas', pk: 'uuid' },
    { name: 'maquinas', pk: 'uuid' },
    { name: 'manutencao_frota', pk: 'uuid' },
    { name: 'planos_adubacao', pk: 'uuid' },
    { name: 'cost_categories', pk: 'id' },
    { name: 'costs', pk: 'id' },
    { name: 'caderno_notas', pk: 'uuid' },
    { name: 'orders', pk: 'id' },
    { name: 'areas', pk: 'uuid' }
];

// O PUSH lê tudo com sync_status = 0
export const pushLocalChanges = async () => {
    try {
        const configObj = await getAppSettings();
        // Fallback p/ farm_id caso o usuário não tenha definido
        const farmId = configObj?.fazenda_documento || 'fazenda_padrao';

        let totalsSynced = 0;

        for (const tableInfo of syncTables) {
            const tableName = tableInfo.name;
            const pk = tableInfo.pk;

            try {
                // Checa itens para subir
                const res = await executeQuery(`SELECT * FROM ${tableName} WHERE sync_status = 0`);
                if (res.rows.length === 0) continue;

                const records = [];
                for (let i = 0; i < res.rows.length; i++) {
                    const item = res.rows.item(i);
                    const cleanItem = { ...item };
                    // Força Inclusão do Farm ID
                    cleanItem.farm_id = cleanItem.farm_id || farmId;

                    // Supabase não precisa da flag sync_status local
                    delete cleanItem.sync_status;
                    records.push(cleanItem);
                }

                if (records.length > 0) {
                    // Upsert Batch Supabase
                    const { error } = await supabase.from(tableName).upsert(records, { onConflict: pk });

                    if (error) {
                        if (__DEV__) console.error(`Erro Push na tabela ${tableName}:`, error);
                    } else {
                        // Marca como Sincronizado no SQLite
                        const ids = records.map(r => typeof r[pk] === 'string' ? `'${r[pk]}'` : r[pk]).join(',');
                        await executeQuery(`UPDATE ${tableName} SET sync_status = 1 WHERE ${pk} IN (${ids})`);
                        totalsSynced += records.length;
                    }
                }
            } catch {
                if (__DEV__) console.log(`Pular push ${tableName}, possivelmente inexistente ou sem sync_status.`);
            }
        }
        return { success: true, pushed: totalsSynced };
    } catch (e) {
        console.error('[SYNC ERROR] Push Error:', e);
        return { success: false, error: e.message };
    }
};

// O PULL puxa tudo pós timestamp
export const pullServerChanges = async () => {
    try {
        const lastSync = await AsyncStorage.getItem('last_pull_timestamp') || '2000-01-01T00:00:00.000Z';
        const currentPullTime = new Date().toISOString();
        const configObj = await getAppSettings();
        const farmId = configObj?.fazenda_documento || 'fazenda_padrao';

        let totalsPulled = 0;

        for (const tableInfo of syncTables) {
            const tableName = tableInfo.name;
            const pk = tableInfo.pk;

            try {
                // Puxa do Supabase dados baseados no last_updated (timestamp longo)
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('farm_id', farmId)
                    .gt('last_updated', lastSync);

                if (error) {
                    if (__DEV__) console.error(`Erro Pull na tabela ${tableName}:`, error);
                    continue;
                }

                if (data && data.length > 0) {
                    for (const remoteRow of data) {
                        const pkValue = remoteRow[pk];
                        if (!pkValue) continue;

                        try {
                            // Busca registro local para comparar timestamps
                            const localRes = await executeQuery(`SELECT last_updated FROM ${tableName} WHERE ${pk} = ?`, [pkValue]);
                            
                            if (localRes.rows.length > 0) {
                                const localRow = localRes.rows.item(0);
                                const localTime = localRow.last_updated ? new Date(localRow.last_updated).getTime() : 0;
                                const remoteTime = remoteRow.last_updated ? new Date(remoteRow.last_updated).getTime() : 0;

                                // Só atualiza se o remoto for estritamente mais recente
                                if (remoteTime > localTime) {
                                    // NOVO: Detecta se o dado local também foi alterado (sync_status = 0)
                                    if (localRow.sync_status === 0) {
                                        if (__DEV__) console.log(`[SYNC] ⚠️ CONFLITO DETECTADO em ${tableName}:${pkValue}. Salvando para resolução manual.`);
                                        
                                        const conflictId = Math.random().toString(36).substr(2, 9);
                                        await executeQuery(
                                            `INSERT INTO v2_sync_conflicts (id, table_name, record_uuid, local_data, remote_data, status) 
                                             VALUES (?, ?, ?, ?, ?, ?)`,
                                            [conflictId, tableName, String(pkValue), JSON.stringify(localRow), JSON.stringify(remoteRow), 'Pendente']
                                        );
                                        
                                        // Também sobe o conflito para o Supabase para auditoria centralizada
                                        await supabase.from('v2_sync_conflicts').insert({
                                            table_name: tableName,
                                            record_uuid: String(pkValue),
                                            local_data: localRow,
                                            remote_data: remoteRow,
                                            status: 'Pendente'
                                        });

                                    } else {
                                        const keys = Object.keys(remoteRow);
                                        const sets = keys.map(k => `"${k}" = ?`).join(', ');
                                        const values = [...Object.values(remoteRow), pkValue];
                                        
                                        await executeQuery(`UPDATE ${tableName} SET ${sets}, sync_status = 1 WHERE ${pk} = ?`, values);
                                    }
                                } else {
                                    if (__DEV__) console.log(`[SYNC] Conflito evitado em ${tableName}:${pkValue}. Local(${localTime}) >= Remoto(${remoteTime})`);
                                }
                            } else {
                                // Inserção simples
                                const rowKeys = Object.keys(remoteRow);
                                const rowValues = Object.values(remoteRow);
                                rowKeys.push('sync_status');
                                rowValues.push(1);

                                const placeholders = rowKeys.map(() => '?').join(', ');
                                const escapeKeys = rowKeys.map(k => `"${k}"`).join(', ');

                                await executeQuery(`INSERT INTO ${tableName} (${escapeKeys}) VALUES (${placeholders})`, rowValues);
                            }
                        } catch (e) {
                            if (__DEV__) console.error(`[SYNC] Erro ao processar registro em ${tableName}:`, e);
                        }
                    }
                    totalsPulled += data.length;
                }
            } catch {
                if (__DEV__) console.log(`Pular pull ${tableName}.`);
            }
        }

        await AsyncStorage.setItem('last_pull_timestamp', currentPullTime);
        return { success: true, pulled: totalsPulled };

    } catch (e) {
        console.error('[SYNC ERROR] Pull Error:', e);
        return { success: false, error: e.message };
    }
};
