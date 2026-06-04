import { executeQuery } from '../database/database';

/**
 * AgroTimelineService
 * 
 * Unifica eventos dispersos em múltiplas tabelas (Plantio, Colheita, Aplicações)
 * em uma única Array Cronológica para montar a Linha do Tempo Visual.
 */
export const AgroTimelineService = {

    /**
     * Busca todos os eventos que ocorreram durante o ciclo de um Plantio específico.
     * @param {string} plantioId - O UUID do Plantio (Ciclo)
     */
    getTimelineByPlantio: async (plantioId) => {
        try {
            const timeline = [];

            // 1. Busca o Evento Origem (O Plantio)
            const resPlantio = await executeQuery(`
                SELECT p.id, p.data_plantio, p.quantidade_sementes, p.espacamento, c.nome as cultura_nome 
                FROM v2_plantios p
                LEFT JOIN v2_culturas c ON c.id = p.cultura_id
                WHERE p.id = ?
            `, [plantioId]);

            if (resPlantio.rows.length > 0) {
                const p = resPlantio.rows.item(0);
                timeline.push({
                    id: `plantio_${p.id}`,
                    type: 'PLANTIO',
                    date: p.data_plantio,
                    title: `Início do Plantio: ${p.cultura_nome || 'Cultura'}`,
                    subtitle: `Qtd: ${p.quantidade_sementes || 0} - Espaçamento: ${p.espacamento || 0}`,
                    icon: 'leaf',
                    color: '#10B981' // Verde Esmeralda
                });
            }

            // 2. Busca Aplicações de Defensivos deste Plantio
            const resAplicacoes = await executeQuery(`
                SELECT id, data_aplicacao, produto_id, dosagem, area_aplicada 
                FROM v2_aplicacoes_defensivos 
                WHERE plantio_id = ?
            `, [plantioId]);

            for (let i = 0; i < resAplicacoes.rows.length; i++) {
                const a = resAplicacoes.rows.item(i);
                timeline.push({
                    id: `aplicacao_${a.id}`,
                    type: 'DEFENSIVO',
                    date: a.data_aplicacao,
                    title: 'Aplicação de Defensivo',
                    subtitle: `Produto ID: ${a.produto_id?.substring(0,8)} | Dose: ${a.dosagem}`,
                    icon: 'flask',
                    color: '#F59E0B' // Amarelo/Laranja
                });
            }

            // 3. Busca Eventos de Colheita
            const resColheitas = await executeQuery(`
                SELECT id, data_colheita, quantidade_total, unidade, qualidade 
                FROM v2_colheitas 
                WHERE plantio_id = ?
            `, [plantioId]);

            for (let i = 0; i < resColheitas.rows.length; i++) {
                const c = resColheitas.rows.item(i);
                timeline.push({
                    id: `colheita_${c.id}`,
                    type: 'COLHEITA',
                    date: c.data_colheita,
                    title: 'Colheita Realizada',
                    subtitle: `Total: ${c.quantidade_total} ${c.unidade} | Qualidade: ${c.qualidade}`,
                    icon: 'tractor',
                    color: '#FBBF24' // Dourado
                });
            }

            // ORDENAÇÃO CRONOLÓGICA (Mais antigo para mais recente)
            timeline.sort((a, b) => {
                const dataA = new Date(a.date).getTime();
                const dataB = new Date(b.date).getTime();
                return dataA - dataB;
            });

            return timeline;

        } catch (error) {
            console.error('[AgroTimelineService] Erro ao buscar timeline:', error);
            throw error;
        }
    },

    /**
     * Busca todos os plantios de um talhão para permitir que o usuário escolha qual ciclo quer ver.
     */
    getPlantiosByTalhao: async (talhaoId) => {
        try {
            const res = await executeQuery(`
                SELECT p.id, p.data_plantio, c.nome as cultura_nome 
                FROM v2_plantios p
                LEFT JOIN v2_culturas c ON c.id = p.cultura_id
                WHERE p.talhao_id = ?
                ORDER BY p.data_plantio DESC
            `, [talhaoId]);
            
            const plantios = [];
            for (let i = 0; i < res.rows.length; i++) {
                plantios.push(res.rows.item(i));
            }
            return plantios;
        } catch (error) {
            console.error('[AgroTimelineService] Erro ao listar plantios:', error);
            return [];
        }
    },

    /**
     * Helper para popular a interface na primeira vez (já que nem todos os usuários terão todos os dados linkados).
     */
    getAllTalhoes: async () => {
        try {
            const res = await executeQuery(`SELECT id, nome FROM v2_talhoes ORDER BY nome ASC`);
            const talhoes = [];
            for(let i=0; i<res.rows.length; i++) talhoes.push(res.rows.item(i));
            return talhoes;
        } catch(e) {
            return [];
        }
    }
};
