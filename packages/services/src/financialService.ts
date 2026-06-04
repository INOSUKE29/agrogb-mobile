export interface TransacaoFinanceira {
    id: string;
    tipo: 'RECEITA' | 'DESPESA' | 'RECEBER' | 'PAGAR';
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'CANCELADO' | 'PAGO_TEMP' | 'CANCELADO_TEMP';
}

export class FinancialService {
    private supabase: any;

    constructor(supabaseClient: any) {
        this.supabase = supabaseClient;
    }

    async getContas(): Promise<TransacaoFinanceira[]> {
        const { data, error } = await this.supabase
            .from('contas')
            .select('*')
            .order('data_vencimento', { ascending: true });
        
        if (error) throw error;
        
        // Mapear DB para UI
        return (data || []).map((item: any) => ({
            id: item.id || item.uuid,
            tipo: item.tipo,
            descricao: item.descricao,
            valor: item.valor,
            data_vencimento: item.data_vencimento,
            status: item.status
        }));
    }

    async updateStatus(id: string, status: 'PAGO' | 'PENDENTE' | 'CANCELADO'): Promise<void> {
        const { error } = await this.supabase
            .from('contas')
            .update({ status })
            .eq('id', id);
        
        if (error) throw error;
    }
}
