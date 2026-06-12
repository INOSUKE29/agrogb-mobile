export interface TechnicalVisit {
    id?: string;
    agronomist_id?: string;
    client_id: string;
    farm_id?: string;
    visit_date: string;
    reason: string;
    location?: string;
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    sync_status?: number;
}

export interface LinkedClient {
    client_id: string;
    nome_completo: string;
    email: string;
    status: string;
    approved_at: string;
}

export interface LinkedAgronomist {
    agronomist_id: string;
    nome_completo: string;
    email: string;
    status: string;
}

export class AgronomistService {
    private supabase: any;

    constructor(supabaseClient: any) {
        this.supabase = supabaseClient;
    }

    // ==========================================
    // CÓDIGOS E VÍNCULOS
    // ==========================================

    async generateOrGetInviteCode(): Promise<string> {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();
        if (userError) throw userError;

        const userId = userData.user.id;

        // Tenta buscar o código existente
        const { data: existing, error: fetchError } = await this.supabase
            .from('agronomist_codes')
            .select('invite_code')
            .eq('agronomist_id', userId)
            .single();

        if (existing && existing.invite_code) {
            return existing.invite_code;
        }

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        // Se não existir, gera um novo código de 6 caracteres aleatórios
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newCode = '';
        for (let i = 0; i < 6; i++) {
            newCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const { error: insertError } = await this.supabase
            .from('agronomist_codes')
            .insert([{ agronomist_id: userId, invite_code: newCode }]);

        if (insertError) throw insertError;

        return newCode;
    }

    async acceptInvite(inviteCode: string): Promise<boolean> {
        const { data, error } = await this.supabase.rpc('accept_agronomist_invite', {
            invite_code_input: inviteCode.toUpperCase()
        });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async getLinkedClients(): Promise<LinkedClient[]> {
        const { data: userData } = await this.supabase.auth.getUser();
        if (!userData || !userData.user) return [];

        // Buscamos os vínculos e fazemos join com profiles
        const { data, error } = await this.supabase
            .from('agronomist_client_links')
            .select(`
                client_id,
                status,
                approved_at,
                client:profiles!client_id (
                    nome_completo,
                    email
                )
            `)
            .eq('agronomist_id', userData.user.id)
            .eq('status', 'ACTIVE');

        if (error) throw error;

        return (data || []).map((link: any) => ({
            client_id: link.client_id,
            status: link.status,
            approved_at: link.approved_at,
            nome_completo: link.client?.nome_completo || 'Produtor',
            email: link.client?.email || ''
        }));
    }

    async getLinkedAgronomist(): Promise<LinkedAgronomist | null> {
        const { data: userData } = await this.supabase.auth.getUser();
        if (!userData || !userData.user) return null;

        const { data, error } = await this.supabase
            .from('agronomist_client_links')
            .select(`
                agronomist_id,
                status,
                agronomist:profiles!agronomist_id (
                    nome_completo,
                    email
                )
            `)
            .eq('client_id', userData.user.id)
            .eq('status', 'ACTIVE')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (!data) return null;

        return {
            agronomist_id: data.agronomist_id,
            status: data.status,
            nome_completo: data.agronomist?.nome_completo || 'Agrônomo',
            email: data.agronomist?.email || ''
        };
    }

    async revokeAccess(agronomistId: string): Promise<void> {
        const { data: userData } = await this.supabase.auth.getUser();
        if (!userData || !userData.user) throw new Error("Usuário não autenticado");

        const { error } = await this.supabase
            .from('agronomist_client_links')
            .update({ status: 'REVOKED', last_updated: new Date().toISOString() })
            .eq('agronomist_id', agronomistId)
            .eq('client_id', userData.user.id);

        if (error) throw error;
    }

    async getClientPlantings(clientId: string): Promise<any[]> {
        // Checa se o agrônomo tem acesso ativo a este cliente
        const { data: userData } = await this.supabase.auth.getUser();
        if (!userData || !userData.user) return [];

        const { data: link } = await this.supabase
            .from('agronomist_client_links')
            .select('status')
            .eq('agronomist_id', userData.user.id)
            .eq('client_id', clientId)
            .eq('status', 'ACTIVE')
            .single();

        if (!link) {
            throw new Error('Acesso negado ou revogado para este produtor.');
        }

        // Se tem acesso, busca os plantios ativos
        const { data, error } = await this.supabase
            .from('areas_plantio')
            .select('*')
            .eq('id_usuario', clientId);

        if (error) {
            console.warn('Erro ao buscar plantios do cliente', error);
            return [];
        }

        return data || [];
    }

    // ==========================================
    // VISITAS TÉCNICAS
    // ==========================================

    async getTechnicalVisits(): Promise<TechnicalVisit[]> {
        const { data, error } = await this.supabase
            .from('technical_visits')
            .select('*')
            .order('visit_date', { ascending: true });

        if (error) throw error;

        return data || [];
    }

    async scheduleTechnicalVisit(visit: TechnicalVisit): Promise<void> {
        const { data: userData } = await this.supabase.auth.getUser();
        if (!userData || !userData.user) throw new Error("Usuário não autenticado");

        const payload = {
            agronomist_id: userData.user.id,
            client_id: visit.client_id,
            farm_id: visit.farm_id,
            visit_date: visit.visit_date,
            reason: visit.reason,
            location: visit.location,
            status: visit.status || 'PENDING',
            sync_status: 0 // Força o trigger do event-sourcing (PULL mobile)
        };

        const { error } = await this.supabase
            .from('technical_visits')
            .insert([payload]);

        if (error) throw error;
    }
}
