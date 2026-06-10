import { executeQuery, atualizarEstoque } from '../database/database';
import { SyncWorker } from './SyncWorker';
import { v4 as uuidv4 } from 'uuid';

export const ManejoService = {
    /**
     * Registra uma aplicação no caderno de campo, dá baixa no estoque e calcula o custo financeiro.
     * @param {Object} dados Objeto contendo os dados do manejo.
     * @returns {Object} { success: boolean, uuid?: string, error?: string }
     */
    registrarManejo: async (dados) => {
        try {
            const now = new Date();
            const dataStr = dados.data || now.toISOString().split('T')[0];
            
            // Calcular data de liberação
            const carencia = parseInt(dados.carencia_dias) || 0;
            const dataLib = new Date(dataStr + 'T12:00:00Z'); // Evitar timezone bug
            dataLib.setDate(dataLib.getDate() + carencia);
            const dataLibStr = dataLib.toISOString().split('T')[0];

            const area = parseFloat(dados.area_hectares) || 1;
            const dose = parseFloat(dados.dose_ha) || 0;
            const preco = parseFloat(dados.preco_unitario) || 0;
            const custoTotal = dose * area * preco;

            const appUuid = uuidv4();
            await executeQuery(
                'INSERT INTO aplicacoes (uuid, talhao_uuid, produto_nome, praga_alvo, dose_ha, volume_calda_l, data, carencia_dias, data_liberacao, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [appUuid, dados.talhao_uuid, (dados.produto_nome || '').toUpperCase(), (dados.praga_alvo || '').toUpperCase(), dose, parseFloat(dados.volume_calda_l) || 0, dataStr, carencia, dataLibStr, now.toISOString()]
            );
            
            // TITANIUM QUEUE: Motor Offline-First (Aplicação)
            SyncWorker.enqueue('aplicacoes', 'INSERT', appUuid, {
                uuid: appUuid,
                talhao_uuid: dados.talhao_uuid,
                produto_nome: (dados.produto_nome || '').toUpperCase(),
                praga_alvo: (dados.praga_alvo || '').toUpperCase(),
                dose_ha: dose,
                volume_calda_l: parseFloat(dados.volume_calda_l) || 0,
                data: dataStr,
                carencia_dias: carencia,
                data_liberacao: dataLibStr,
                last_updated: now.toISOString(),
                is_deleted: 0
            });

            // TITANIUM CUSTEIO: Motor Financeiro Automático
            if (custoTotal > 0) {
                const finUuid = uuidv4();
                await executeQuery(
                    `INSERT INTO financeiro_transacoes (uuid, tipo, categoria, descricao, valor, vencimento, status, talhao_uuid, operacao_uuid, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
                    [finUuid, 'PAGAR', 'INSUMOS AGRÍCOLAS', `Custeio: Aplicação de ${(dados.produto_nome || '').toUpperCase()}`, custoTotal, dataStr, 'PAGO', dados.talhao_uuid, appUuid, now.toISOString()]
                );
                
                SyncWorker.enqueue('financeiro_transacoes', 'INSERT', finUuid, {
                    uuid: finUuid,
                    tipo: 'PAGAR',
                    categoria: 'INSUMOS AGRÍCOLAS',
                    descricao: `Custeio: Aplicação de ${(dados.produto_nome || '').toUpperCase()}`,
                    valor: custoTotal,
                    vencimento: dataStr,
                    status: 'PAGO',
                    talhao_uuid: dados.talhao_uuid,
                    operacao_uuid: appUuid,
                    last_updated: now.toISOString(),
                    is_deleted: 0
                });
            }

            // BAIXA DE ESTOQUE (NÃO BLOQUEANTE)
            const qtdBaixa = dose * area;
            if (qtdBaixa > 0) {
                await atualizarEstoque((dados.produto_nome || '').toUpperCase(), -qtdBaixa, dataStr);
            }
            
            return { success: true, uuid: appUuid, dataLibStr };
        } catch (e) {
            console.log('Erro no ManejoService:', e);
            return { success: false, error: e.message };
        }
    }
};
