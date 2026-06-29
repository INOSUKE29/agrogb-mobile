// MonetizationService.js
// Arquitetura centralizada de controle de acessos, quotas e limites.

/**
 * MODO DE TESTE (Bypass)
 * Se true: Todos os limites são ignorados e o usuário tem acesso total (Premium) para testes.
 * Se false: As regras de negócio de monetização entram em vigor.
 */
export const IS_TEST_MODE = true;

/**
 * Grupos Estruturais de Funcionalidades do Aplicativo
 */
export const MODULE_GROUPS = {
    TRABALHO_EM_CAMPO: 'trabalho_em_campo', // CRM, Cadastros, Diagnósticos, Prescrições
    FINANCEIRO: 'financeiro',               // Custos, Despesas, Margem
    RELATORIOS: 'relatorios'                // KPIs Analíticos, Exportações PDF
};

/**
 * Planos e Limites (Mock base para o futuro)
 */
const PLAN_LIMITS = {
    FREE: {
        max_photos_per_diagnostic: 3,
        can_access_finance: false,
        can_access_reports: false,
        max_farms: 1
    },
    PREMIUM: {
        max_photos_per_diagnostic: 20,
        can_access_finance: true,
        can_access_reports: true,
        max_farms: 999
    }
};

/**
 * Função utilitária interna para recuperar o plano atual do usuário.
 * No futuro, isso buscará do banco de dados (tabela usuarios ou app_settings).
 */
const getCurrentPlan = async () => {
    // TODO: Implementar busca do perfil do usuário do Supabase/Local.
    // Atualmente força 'FREE' caso o modo de teste seja desativado.
    return 'FREE';
};

/**
 * Valida se o usuário pode subir uma foto adicional no diagnóstico.
 * @param {number} currentPhotoCount - Quantidade de fotos já anexadas neste diagnóstico
 * @returns {Promise<boolean>}
 */
export const canUploadDiagnosticPhoto = async (currentPhotoCount) => {
    if (IS_TEST_MODE) return true;

    const plan = await getCurrentPlan();
    const limit = PLAN_LIMITS[plan]?.max_photos_per_diagnostic || 0;
    
    return currentPhotoCount < limit;
};

/**
 * Valida se o usuário tem acesso ao Módulo de Controladoria Financeira.
 * @returns {Promise<boolean>}
 */
export const canAccessFinanceModule = async () => {
    if (IS_TEST_MODE) return true;

    const plan = await getCurrentPlan();
    return PLAN_LIMITS[plan]?.can_access_finance || false;
};

/**
 * Valida se o usuário tem acesso ao Módulo de Relatórios Analíticos.
 * @returns {Promise<boolean>}
 */
export const canAccessReportsModule = async () => {
    if (IS_TEST_MODE) return true;

    const plan = await getCurrentPlan();
    return PLAN_LIMITS[plan]?.can_access_reports || false;
};

/**
 * Valida se o usuário pode cadastrar uma nova fazenda (CRM).
 * @param {number} currentFarmsCount - Quantidade atual de fazendas cadastradas
 * @returns {Promise<boolean>}
 */
export const canAddFarm = async (currentFarmsCount) => {
    if (IS_TEST_MODE) return true;

    const plan = await getCurrentPlan();
    const limit = PLAN_LIMITS[plan]?.max_farms || 1;

    return currentFarmsCount < limit;
};

export default {
    IS_TEST_MODE,
    MODULE_GROUPS,
    canUploadDiagnosticPhoto,
    canAccessFinanceModule,
    canAccessReportsModule,
    canAddFarm
};
