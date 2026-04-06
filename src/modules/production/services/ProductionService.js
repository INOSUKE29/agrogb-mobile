import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * ProductionService (V1.1 DIAMOND PRO) 💎
 * Centraliza Plantio, Colheita e Monitoramento. 🚀
 */
export const ProductionService = {
    // COLHEITA
    recordHarvest: async (data) => {
        const uuid = data.uuid || uuidv4();
        const timestamp = new Date().toISOString();

        await executeQuery(
            `INSERT INTO production_harvests (id, area_id, cultura_id, quantidade, data_colheita, last_updated) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuid, data.area_id, data.cultura_id, data.quantidade, data.data_colheita, timestamp]
        );

        // Sync (Legacy path supported via table mapping in Supabase)
        supabase.from('production_harvests').insert([{
            id: uuid,
            area_id: data.area_id,
            quantidade: data.quantidade,
            data_colheita: data.data_colheita
        }]);

        return { id: uuid, ...data };
    },

    // MONITORAMENTO
    recordMonitoring: async (data) => {
        const uuid = uuidv4();
        await executeQuery(
            `INSERT INTO production_monitoring (id, area_id, tipo, observacao, data_registro) VALUES (?, ?, ?, ?, ?)`,
            [uuid, data.area_id, data.tipo, data.observacao, new Date().toISOString()]
        );
        return { id: uuid, ...data };
    },

    // CONGELAMENTO
    recordFreezing: async (data) => {
        const uuid = data.uuid || uuidv4();
        await executeQuery(
            `INSERT INTO v2_congelados (id, produto, quantidade_kg, motivo, data, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
            [uuid, data.produto, data.quantidade_kg, data.motivo, data.data, 'pending']
        );
    },

    // DESCARTE / PERDA
    recordWaste: async (data) => {
        const uuid = data.uuid || uuidv4();
        await executeQuery(
            `INSERT INTO v2_descartes (id, produto, quantidade_kg, motivo, data, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
            [uuid, data.produto, data.quantidade_kg, data.motivo, data.data, 'pending']
        );
    },

    // ADUBAÇÃO INTELIGENTE
    saveFertilizationPlan: async (plano, itens) => {
        const planoUuid = plano.uuid || uuidv4();
        const timestamp = new Date().toISOString();

        // 1. Salva/Atualiza o Plano
        if (plano.id) {
            await executeQuery(
                `UPDATE planos_adubacao SET nome_plano = ?, cultura = ?, tipo_aplicacao = ?, area_local = ?, descricao_tecnica = ?, last_updated = ? WHERE uuid = ?`,
                [plano.nome_plano, plano.cultura, plano.tipo_aplicacao, plano.area_local, plano.descricao_tecnica, timestamp, planoUuid]
            );
        } else {
            await executeQuery(
                `INSERT INTO planos_adubacao (uuid, nome_plano, cultura, tipo_aplicacao, area_local, descricao_tecnica, data_criacao, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [planoUuid, plano.nome_plano, plano.cultura, plano.tipo_aplicacao, plano.area_local, plano.descricao_tecnica, timestamp, timestamp]
            );
        }

        // 2. Salva Itens da Receita (Limpa anteriores se for edit)
        await executeQuery(`DELETE FROM production_fertilization_items WHERE plano_uuid = ?`, [planoUuid]);
        for (const item of itens) {
            const itemUuid = uuidv4();
            await executeQuery(
                `INSERT INTO production_fertilization_items (id, plano_uuid, produto_id, quantidade, unidade) VALUES (?, ?, ?, ?, ?)`,
                [itemUuid, planoUuid, item.produto_id, item.quantidade, item.unidade]
            );
        }

        return { uuid: planoUuid };
    },

    applyFertilization: async (planoUuid) => {
        try {
            const { atualizarEstoque } = require('../../../database/database'); // Lazy import para evitar Require Cycle
            
            // 1. Pega os itens da receita salvos localmente
            const res = await executeQuery(`SELECT * FROM production_fertilization_items WHERE plano_uuid = ?`, [planoUuid]);
            
            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                // 2. Abate do estoque local
                await atualizarEstoque(item.produto_id, -item.quantidade);
                
                // 3. Registra movimentação de saída (Consumo)
                await executeQuery(
                    `INSERT INTO movimentacao_estoque (uuid, produto_id, tipo, quantidade, origem, data, observacao, last_updated, sync_status) VALUES (?,?,?,?,?,?,?,?,0)`,
                    [uuidv4(), item.produto_id, 'CONSUMO', item.quantidade, 'ADUBACAO', new Date().toISOString(), 'Consumo Plano ' + planoUuid, new Date().toISOString()]
                );
            }

            // 4. Marca plano como concluído
            const timestamp = new Date().toISOString();
            await executeQuery(
                `UPDATE planos_adubacao SET status = 'CONCLUIDO', data_aplicacao = ?, last_updated = ? WHERE uuid = ?`,
                [timestamp, timestamp, planoUuid]
            );

            // 5. Tentativa de Sincronização Server-Side (Não quebra se offline)
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase.rpc('apply_fertilization_v2', {
                        p_plano_uuid: planoUuid, p_user_id: user.id
                    }).catch(() => console.log('RPC Supabase falou em background (Offline mode)'));
                }
            }).catch(() => {});

            return { success: true };
        } catch (error) {
            console.error('[ProductionService] Erro ao aplicar adubação:', error);
            throw error;
        }
    }
};
