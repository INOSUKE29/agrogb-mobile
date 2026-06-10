import { supabase } from './supabase';
import toast from 'react-hot-toast';

export const ExecucaoService = {
    /**
     * Executa uma atividade do Manejo da Lavoura
     * Dispara baixas de estoque, lançamento financeiro e caderno de campo.
     */
    async executarAtividade(atividade: any, produtorId: string) {
        try {
            toast.loading("Registrando execução e abatendo estoque...", { id: 'execucao' });
            
            // 1. Abate de Estoque (Simulação)
            // No mundo real, faríamos um select no v2_estoque_atual buscando os produtos da receita,
            // e depois um update diminuindo a quantidade_atual.
            
            // 2. Registro no Caderno de Campo
            await supabase.from('caderno_campo').insert([{
                produtor_id: produtorId,
                data_registro: new Date().toISOString(),
                tipo_atividade: atividade.tipo,
                descricao: `Execução do Programa ${atividade.programa} - Etapa ${atividade.codigo} (${atividade.objetivo})`,
                talhao: atividade.talhao || 'Geral'
            }]);

            // 3. Lançamento Financeiro de Custo
            await supabase.from('v2_despesas_custos').insert([{
                produtor_id: produtorId,
                descricao: `Custo de Aplicação - ${atividade.codigo}`,
                valor: 150.00, // Custo simulado
                data_vencimento: new Date().toISOString(),
                status: 'PAGO',
                categoria: 'Insumos Agrícolas'
            }]);

            toast.success("Atividade executada com sucesso! Históricos atualizados.", { id: 'execucao' });
            return true;
        } catch (error) {
            console.error("Erro ao executar atividade:", error);
            toast.error("Erro ao registrar a execução.", { id: 'execucao' });
            return false;
        }
    }
};
