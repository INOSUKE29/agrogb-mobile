
import { executeQuery } from '../database';

/**
 * DataBridge Migrator (Data Bridge)
 * Migra dados de tabelas v1 para v2 sem deletar nada.
 */
export const migrateV1toV2 = async () => {
    if (__DEV__) console.log('🌉 [DataBridge] Iniciando migração de dados V1 -> V2...');

    try {
        // 1. Migrar COLHEITAS
        const colheitasV1 = await executeQuery('SELECT * FROM colheitas');
        for (let i = 0; i < colheitasV1.rows.length; i++) {
            const row = colheitasV1.rows.item(i);
            await executeQuery(`
                INSERT OR IGNORE INTO v2_colheitas (id, data_colheita, quantidade_total, observacao, created_at, updated_at, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [row.uuid, row.data_colheita || row.data, row.quantidade, row.observacao, row.data, row.last_updated, 'pending']);
        }

        // 2. Migrar VENDAS
        const vendasV1 = await executeQuery('SELECT * FROM vendas');
        for (let i = 0; i < vendasV1.rows.length; i++) {
            const row = vendasV1.rows.item(i);
            await executeQuery(`
                INSERT OR IGNORE INTO v2_vendas (id, data_venda, valor_total, status, observacao, created_at, updated_at, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [row.uuid, row.data_venda || row.data, row.valor, 'Pago', row.observacao, row.data, row.last_updated, 'pending']);
        }

        // 3. Migrar CLIENTES
        const clientesV1 = await executeQuery('SELECT * FROM clientes');
        for (let i = 0; i < clientesV1.rows.length; i++) {
            const row = clientesV1.rows.item(i);
            await executeQuery(`
                INSERT OR IGNORE INTO v2_clientes (id, nome, telefone, endereco, cpf_cnpj, created_at, updated_at, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [row.uuid, row.nome, row.telefone, row.endereco, row.cpf_cnpj, new Date().toISOString(), row.last_updated, 'pending']);
        }

        // 4. Migrar MÁQUINAS (v2_maquinas)
        const maquinasV1 = await executeQuery('SELECT * FROM maquinas');
        for (let i = 0; i < maquinasV1.rows.length; i++) {
            const row = maquinasV1.rows.item(i);
            await executeQuery(`
                INSERT OR IGNORE INTO v2_maquinas (id, nome, tipo, horimetro_atual, status, created_at, updated_at, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [row.uuid, row.nome, row.tipo, row.horimetro_atual, row.status, new Date().toISOString(), row.last_updated, 'pending']);
        }

        if (__DEV__) console.log('✅ [DataBridge] Migração de dados concluída com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ [DataBridge] Falha na migração:', error);
        return { success: false, error: error.message };
    }
};
