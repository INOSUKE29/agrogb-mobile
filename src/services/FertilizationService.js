
import { executeQuery } from '../database/database';
import { SyncWorker } from './SyncWorker';

/**
 * FertilizationService (Phase V3)
 * Motor de regras agronômicas para recomendações inteligentes.
 */
export const FertilizationService = {

    /**
     * Analisa uma amostra de solo e gera recomendações automáticas.
     */
    analyzeSoil: async (soilData) => {
        const recommendations = [];
        const { ph, potassio, fosforo, talhao_id } = soilData;

        // Regra 1: Acidez (pH)
        if (ph < 5.5) {
            recommendations.push({
                tipo: 'Calagem',
                titulo: 'Solo Ácido Detectado',
                descricao: 'O pH está abaixo do ideal. Recomendamos calagem para correção.',
                dose_sugerida: 'Baseado na PRNT do Calcário',
                produto_sugerido: 'Calcário Dolomítico',
                baseado_em: `pH: ${ph}`
            });
        }

        // Regra 2: Deficiência de Potássio (K) - Foco Morango/Geral
        if (potassio < 0.3) {
            recommendations.push({
                tipo: 'Fertilização',
                titulo: 'Baixo Potássio (K)',
                descricao: 'Níveis de potássio estão críticos para a fase de produção.',
                dose_sugerida: '2 L / ha',
                produto_sugerido: 'Power Brix ou similar (Rico em K)',
                baseado_em: `K: ${potassio}`
            });
        }

        // Regra 3: Fósforo (P)
        if (fosforo < 15) {
            recommendations.push({
                tipo: 'Fertilização',
                titulo: 'Deficiência de Fósforo (P)',
                descricao: 'Fósforo baixo pode afetar o enraizamento e floração.',
                dose_sugerida: 'Ajustar via adubação de solo',
                produto_sugerido: 'Super Simples / MAP',
                baseado_em: `P: ${fosforo}`
            });
        }

        // Salva as recomendações no banco local e enfileira para o Supabase
        for (const rec of recommendations) {
            const recId = Math.random().toString(36).substr(2, 9);
            const fullRec = { ...rec, id: recId, talhao_id, status: 'Pendente' };

            await executeQuery(
                `INSERT INTO v2_recomendacoes_tecnicas (id, talhao_id, tipo, status, titulo, descricao, dose_sugerida, produto_sugerido, baseado_em)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [recId, talhao_id, rec.tipo, 'Pendente', rec.titulo, rec.descricao, rec.dose_sugerida, rec.produto_sugerido, rec.baseado_em]
            );

            // Enfileira para Sync V2
            await SyncWorker.enqueue('v2_recomendacoes_tecnicas', 'INSERT', recId, fullRec);
        }

        return recommendations;
    }
};
