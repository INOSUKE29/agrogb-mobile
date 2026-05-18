import { executeQuery, genericUpsert } from '../database/database';
import { getSupabase, syncTable } from './supabase';

export const AgronomistService = {
    /**
     * Recupera o código de convite de um agrônomo (local ou remoto)
     */
    getAgronomistCode: async (agronomistUuid) => {
        try {
            // 1. Tenta local primeiro
            const res = await executeQuery('SELECT code FROM agronomist_codes WHERE agronomist_id = ?', [agronomistUuid]);
            if (res.rows.length > 0) {
                return res.rows.item(0).code;
            }

            // 2. Tenta remoto
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('agronomist_codes')
                .select('code')
                .eq('agronomist_id', agronomistUuid)
                .single();

            if (data && data.code) {
                // Salva localmente
                await genericUpsert('agronomist_codes', {
                    agronomist_id: agronomistUuid,
                    code: data.code,
                    created_at: new Date().toISOString()
                });
                return data.code;
            }
            return null;
        } catch (e) {
            console.log('Erro ao obter código do agrônomo:', e.message || e);
            return null;
        }
    },

    /**
     * Vincula o cliente logado a um agrônomo a partir do código deste
     */
    linkWithAgronomist: async (clientUuid, code) => {
        try {
            const cleanCode = code.trim().toUpperCase();
            if (cleanCode.length !== 9) { // AGRO-XXXX
                throw new Error('Código de convite inválido. Deve ser no formato AGRO-XXXX.');
            }

            const supabase = getSupabase();

            // 1. Verifica se o código existe remotamente
            const { data: codeData, error: codeError } = await supabase
                .from('agronomist_codes')
                .select('agronomist_id')
                .eq('code', cleanCode)
                .single();

            if (codeError || !codeData) {
                throw new Error('Código de convite não encontrado ou inválido.');
            }

            const agronomistUuid = codeData.agronomist_id;

            if (agronomistUuid === clientUuid) {
                throw new Error('Você não pode se vincular a si mesmo!');
            }

            // 2. Cria o vínculo localmente
            const linkUuid = `${clientUuid}_${agronomistUuid}`; // UUID composto determinístico
            const newLink = {
                uuid: linkUuid,
                agronomist_id: agronomistUuid,
                client_id: clientUuid,
                status: 'ACTIVE',
                source_platform: 'mobile',
                sync_status: 0,
                last_updated: new Date().toISOString()
            };

            await genericUpsert('agronomist_client_links', newLink);

            // 3. Tenta sincronizar imediatamente para a nuvem
            try {
                await syncTable('agronomist_client_links');
            } catch (syncErr) {
                console.log('⚠️ Sincronismo em background agendado:', syncErr.message);
            }

            return { success: true, agronomistId: agronomistUuid };
        } catch (e) {
            console.log('Erro ao criar vínculo:', e.message || e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Recupera os vínculos ativos (Agrônomo vê seus Clientes, Cliente vê seu Agrônomo)
     */
    getActiveLinks: async (userUuid, role) => {
        try {
            let sql = '';
            let params = [];

            if (role === 'AGRONOMO') {
                // Agrônomo quer ver a lista de clientes vinculados a ele
                sql = `
                    SELECT l.*, u.nome_completo as client_name, u.email as client_email, u.telefone as client_phone
                    FROM agronomist_client_links l
                    JOIN usuarios u ON l.client_id = u.uuid
                    WHERE l.agronomist_id = ? AND l.status = 'ACTIVE' AND l.is_deleted = 0
                `;
                params = [userUuid];
            } else {
                // Cliente quer ver o agrônomo vinculado a ele
                sql = `
                    SELECT l.*, u.nome_completo as agronomist_name, u.email as agronomist_email, u.telefone as agronomist_phone
                    FROM agronomist_client_links l
                    JOIN usuarios u ON l.agronomist_id = u.uuid
                    WHERE l.client_id = ? AND l.status = 'ACTIVE' AND l.is_deleted = 0
                `;
                params = [userUuid];
            }

            const res = await executeQuery(sql, params);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                rows.push(res.rows.item(i));
            }
            return rows;
        } catch (e) {
            console.log('Erro ao obter vínculos:', e.message || e);
            return [];
        }
    }
};
