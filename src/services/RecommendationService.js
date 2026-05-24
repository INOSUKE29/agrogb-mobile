import { executeQuery, genericUpsert } from '../database/database';
import { getSupabase, syncTable } from './supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const RecommendationService = {
    /**
     * Cria uma nova recomendação técnica offline-first e sincroniza com a nuvem
     */
    createRecommendation: async (rec) => {
        try {
            const uuid = rec.uuid || uuidv4();
            const newRec = {
                uuid,
                agronomist_id: rec.agronomist_id,
                client_id: rec.client_id,
                farm_id: rec.farm_id || null,
                field_id: rec.field_id || null,
                planting_id: rec.planting_id || null,
                recipe_type: rec.recipe_type || 'GOTEJO', // GOTEJO ou FOLIAR
                recipe_data: typeof rec.recipe_data === 'string' ? rec.recipe_data : JSON.stringify(rec.recipe_data),
                notes: rec.notes || '',
                status: rec.status || 'PENDING', // PENDING, APPLIED, CANCELLED
                source_platform: 'mobile',
                sync_status: 0,
                last_updated: new Date().toISOString()
            };

            await genericUpsert('recommendations', newRec);

            // Tenta sincronizar com Supabase em background
            try {
                await syncTable('recommendations');
            } catch (syncErr) {
                console.log('⚠️ Sincronização em background agendada:', syncErr.message);
            }

            return { success: true, uuid };
        } catch (e) {
            console.log('Erro ao criar recomendação:', e.message || e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Recupera a lista de recomendações ativas baseada na role do usuário
     */
    getRecommendations: async (userUuid, role) => {
        try {
            let sql = `
                SELECT r.*, 
                       u.nome_completo as agronomist_name, 
                       c.nome_completo as client_name,
                       fi.nome as field_name,
                       p.cultura as planting_culture
                FROM recommendations r
                LEFT JOIN usuarios u ON r.agronomist_id = u.uuid
                LEFT JOIN usuarios c ON r.client_id = c.uuid
                LEFT JOIN fields fi ON r.field_id = fi.uuid
                LEFT JOIN plantio p ON r.planting_id = p.uuid
                WHERE r.is_deleted = 0
            `;
            const params = [];

            if (role === 'AGRONOMO') {
                sql += ' AND r.agronomist_id = ?';
                params.push(userUuid);
            } else if (role === 'CLIENTE') {
                sql += ' AND r.client_id = ?';
                params.push(userUuid);
            }

            sql += ' ORDER BY r.last_updated DESC';

            const res = await executeQuery(sql, params);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                // Converte recipe_data de JSON string para objeto JS
                try {
                    item.recipe_data = JSON.parse(item.recipe_data);
                } catch (parseErr) {
                    item.recipe_data = [];
                }
                rows.push(item);
            }
            return rows;
        } catch (e) {
            console.log('Erro ao obter recomendações:', e.message || e);
            return [];
        }
    },

    /**
     * Atualiza o status de execução de uma recomendação técnica (ex: CLIENTE clica em "Aplicar")
     */
    updateRecommendationStatus: async (uuid, status) => {
        try {
            const validStatus = ['PENDING', 'APPLIED', 'CANCELLED'];
            if (!validStatus.includes(status)) {
                throw new Error('Status de recomendação inválido.');
            }

            await executeQuery(
                `UPDATE recommendations SET status = ?, sync_status = 0, last_updated = ? WHERE uuid = ?`,
                [status, new Date().toISOString(), uuid]
            );

            // Tenta sincronizar com o Supabase imediatamente
            try {
                await syncTable('recommendations');
            } catch (syncErr) {
                console.log('⚠️ Sincronismo em background agendado:', syncErr.message);
            }

            return { success: true };
        } catch (e) {
            console.log('Erro ao atualizar recomendação:', e.message || e);
            return { success: false, error: e.message };
        }
    }
};
