import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * FleetService (V1.1 DIAMOND PRO) 💎
 * Gestão de Máquinas e Equipamentos. 🚜🚀
 */
export const FleetService = {
    getAll: async () => {
        const res = await executeQuery('SELECT * FROM farm_machines WHERE is_deleted = 0 ORDER BY nome ASC');
        return res.rows._array;
    },

    saveMachine: async (data) => {
        const uuid = data.id || uuidv4();
        const timestamp = new Date().toISOString();

        if (data.id) {
            await executeQuery(
                `UPDATE farm_machines SET nome = ?, tipo = ?, horimetro = ?, last_updated = ?, sync_status = 0 WHERE id = ?`,
                [data.nome.toUpperCase(), data.tipo, data.horimetro, timestamp, uuid]
            );
        } else {
            await executeQuery(
                `INSERT INTO farm_machines (id, nome, tipo, horimetro, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
                [uuid, data.nome.toUpperCase(), data.tipo, data.horimetro, timestamp, 0]
            );
        }

        // Sync
        supabase.from('farm_machines').upsert([{
            id: uuid,
            nome: data.nome.toUpperCase(),
            tipo: data.tipo,
            horimetro: data.horimetro
        }]);

        return { id: uuid, ...data };
    }
};
