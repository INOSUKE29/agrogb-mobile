import { executeQuery } from '../database/core';

// Helper Generic Repository Pattern
const createRepository = (table) => ({

    table,

    async create(data, userId) {
        if (!userId) throw new Error('Security: User ID required for create');

        const keys = Object.keys(data);
        const values = Object.values(data);

        // Inject user_id
        keys.push('user_id');
        values.push(userId);

        const placeholders = keys.map(() => '?').join(',');
        const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;

        return await executeQuery(sql, values);
    },

    async findAll(userId, orderBy = 'id DESC') {
        if (!userId) return [];
        return await executeQuery(`SELECT * FROM ${table} WHERE user_id = ? AND is_deleted = 0 ORDER BY ${orderBy}`, [userId]);
    },

    async findDeleted(userId, orderBy = 'id DESC') {
        if (!userId) return [];
        return await executeQuery(`SELECT * FROM ${table} WHERE user_id = ? AND is_deleted = 1 ORDER BY ${orderBy}`, [userId]);
    },

    async findByUuid(uuid, userId) {
        if (!userId) return null;
        const res = await executeQuery(`SELECT * FROM ${table} WHERE uuid = ? AND user_id = ?`, [uuid, userId]);
        return res.rows.length > 0 ? res.rows.item(0) : null;
    },

    async update(uuid, data, userId) {
        if (!userId) throw new Error('Security: User ID required for update');

        const updates = Object.keys(data).map(k => `${k} = ?`).join(',');
        const values = [...Object.values(data), new Date().toISOString(), uuid, userId];

        const sql = `UPDATE ${table} SET ${updates}, last_updated = ?, sync_status = 0 WHERE uuid = ? AND user_id = ?`;
        return await executeQuery(sql, values);
    },

    async delete(uuid, userId) {
        if (!userId) throw new Error('Security: User ID required for delete');
        // Soft Delete (Fase 6) em vez de DELETE puro
        return await executeQuery(`UPDATE ${table} SET is_deleted = 1, sync_status = 0, last_updated = ? WHERE uuid = ? AND user_id = ?`, [new Date().toISOString(), uuid, userId]);
    },

    async restore(uuid, userId) {
        if (!userId) throw new Error('Security: User ID required for restore');
        return await executeQuery(`UPDATE ${table} SET is_deleted = 0, sync_status = 0, last_updated = ? WHERE uuid = ? AND user_id = ?`, [new Date().toISOString(), uuid, userId]);
    },

    // Admin/System Use Only (Sync)
    async findAllPending() {
        return await executeQuery(`SELECT * FROM ${table} WHERE sync_status = 0`);
    },

    async markSynced(uuid) {
        return await executeQuery(`UPDATE ${table} SET sync_status = 1 WHERE uuid = ?`, [uuid]);
    }
});

export const VendasRepository = createRepository('vendas');
export const ColheitasRepository = createRepository('colheitas');
export const CustosRepository = createRepository('custos');
export const ClientesRepository = createRepository('clientes');
export const ComprasRepository = createRepository('compras');
export const EstoqueRepository = createRepository('estoque'); // Needs custom logic for Stock
