export interface Talhao {
    uuid: string;
    nome: string;
    area_ha: number;
    observacao: string;
    is_deleted: boolean;
    last_updated: string;
    tableUsed: string;
}

export class TalhoesService {
    private supabase: any;

    constructor(supabaseClient: any) {
        this.supabase = supabaseClient;
    }

    async getTalhoes(): Promise<Talhao[]> {
        // Tenta buscar da v2 primeiro
        const response = await this.supabase
            .from('v2_talhoes')
            .select('*')
            .order('nome', { ascending: true });
        
        let data = response.data;
        const error = response.error;
            
        if (error) {
            // Se falhar (não existe/cache), tenta a v1
            const fallback = await this.supabase
                .from('talhoes')
                .select('*')
                .eq('is_deleted', false)
                .order('nome', { ascending: true });
            if (fallback.error) throw fallback.error;
            data = fallback.data;
        }

        return (data || []).map((item: any) => ({
            uuid: item.id || item.uuid,
            nome: item.nome,
            area_ha: item.area || item.area_ha || 0,
            observacao: item.tipo_solo || item.observacao || '',
            is_deleted: item.is_deleted || false,
            last_updated: item.updated_at || item.last_updated || new Date().toISOString(),
            tableUsed: item.id ? 'v2_talhoes' : 'talhoes'
        })).filter((t: Talhao) => !t.is_deleted);
    }

    async saveTalhao(item: Partial<Talhao>, isEdit: boolean, userId?: string) {
        if (isEdit && item.uuid && item.tableUsed) {
            const payload = item.tableUsed === 'v2_talhoes' 
                ? { nome: item.nome, area: item.area_ha, tipo_solo: item.observacao, updated_at: new Date().toISOString() }
                : { nome: item.nome, area_ha: item.area_ha, observacao: item.observacao, last_updated: new Date().toISOString() };
            
            const idField = item.tableUsed === 'v2_talhoes' ? 'id' : 'uuid';

            const { error } = await this.supabase
                .from(item.tableUsed)
                .update(payload)
                .eq(idField, item.uuid);
            
            if (error) throw error;
        } else {
            // INSERT (Try v2 first)
            const payloadV2 = {
                nome: item.nome,
                area: item.area_ha,
                tipo_solo: item.observacao,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.supabase.from('v2_talhoes').insert([payloadV2]);
            if (error) {
                // Fallback to v1
                const payloadV1 = {
                    nome: item.nome,
                    area_ha: item.area_ha,
                    observacao: item.observacao,
                    last_updated: new Date().toISOString(),
                    is_deleted: false,
                    user_id: userId
                };
                const fallbackError = await this.supabase.from('talhoes').insert([payloadV1]);
                if (fallbackError.error) throw fallbackError.error;
            }
        }
    }

    async deleteTalhao(item: Talhao) {
        const idField = item.tableUsed === 'v2_talhoes' ? 'id' : 'uuid';
        if (item.tableUsed === 'v2_talhoes') {
            const { error } = await this.supabase.from('v2_talhoes').delete().eq(idField, item.uuid);
            if (error) throw error;
        } else {
            const { error } = await this.supabase.from('talhoes').update({ is_deleted: true, last_updated: new Date().toISOString() }).eq(idField, item.uuid);
            if (error) throw error;
        }
    }
}
