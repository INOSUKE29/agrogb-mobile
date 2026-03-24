import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * PlantioService (DIAMOND PRO) 💎🌱
 * Centraliza a lógica de registros de plantio e baixa de sementes.
 */
export const PlantioService = {
    
    // Lista os últimos plantios
    getHistory: async (limit = 20) => {
        try {
            const res = await executeQuery('SELECT * FROM plantio ORDER BY data DESC LIMIT ?', [limit]);
            return res.rows._array || [];
        } catch (error) {
            console.error('[PlantioService] Erro ao buscar histórico:', error);
            throw error;
        }
    },

    // Salva um novo plantio
    savePlanting: async (data) => {
        const uuid = data.uuid || uuidv4();
        const timestamp = new Date().toISOString();
        
        try {
            // 1. Salva no SQLite Local
            await executeQuery(
                `INSERT INTO plantio (uuid, cultura, quantidade_pes, tipo_plantio, data, observacao, last_updated) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    uuid, 
                    data.cultura.toUpperCase(), 
                    data.quantidade_pes, 
                    data.tipo_plantio.toUpperCase(), 
                    data.data || timestamp.split('T')[0], 
                    data.observacao ? data.observacao.toUpperCase() : '',
                    timestamp
                ]
            );

            // 2. Sincronização em Background com Supabase
            // Nota: Adicionamos o user_id capturado do auth do Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                supabase.from('plantio').insert([{
                    uuid: uuid,
                    user_id: user.id,
                    cultura: data.cultura.toUpperCase(),
                    quantidade_pes: data.quantidade_pes,
                    tipo_plantio: data.tipo_plantio.toUpperCase(),
                    data: data.data || timestamp,
                    observacao: data.observacao,
                    last_updated: timestamp
                }]).then(({ error }) => {
                    if (error) console.error('[PlantioService] Erro na sync Supabase:', error);
                });
            }

            // 3. Integração Automática com Estoque (Se houver produto vinculado)
            // Futuramente poderíamos disparar a baixa aqui, mas por enquanto faremos manual via Hook
            
            return { uuid, status: 'success' };
        } catch (error) {
            console.error('[PlantioService] Erro ao salvar plantio:', error);
            throw error;
        }
    },

    // Exclui um registro
    deletePlanting: async (uuid) => {
        try {
            await executeQuery('DELETE FROM plantio WHERE uuid = ?', [uuid]);
            
            // Sync Delete Supabase
            supabase.from('plantio').delete().eq('uuid', uuid).then(({error}) => {
                if(error) console.error('[PlantioService] Erro ao deletar no Supabase:', error);
            });
            
            return true;
        } catch (error) {
            console.error('[PlantioService] Erro ao excluir:', error);
            throw error;
        }
    }
};
