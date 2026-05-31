/**
 * PermissionService.js
 * Gerencia níveis de acesso e visibilidade de módulos baseado no cargo.
 * Compatível com arquitetura modular (Mobile & Desktop).
 */

const ROLE_PERMISSIONS = {
    'ADMIN': {
        all: true,
        financial: true,
        settings: true,
        governance: true
    },
    'CLIENTE': {
        all: false,
        financial: true,
        settings: true,
        governance: true,
        operational: true,
        modules: [
            'Home', 'Cadastro', 'Propriedades', 'Talhoes', 'Plantios', 'Culturas', 
            'Clientes', 'Fornecedores', 'Maquinas', 'Manutencoes', 'Estoque', 
            'Vendas', 'Compras', 'Custos', 'Descarte', 'Irrigacao', 'Fertirrigacao', 
            'Aplicacoes', 'Relatorios', 'Sync', 'CadernoNotas', 'AgronomistLink', 
            'RecommendationsList'
        ]
    },
    'AGRONOMO': {
        all: false,
        financial: false,
        settings: false,
        governance: false,
        operational: true,
        modules: [
            'Home', 'Monitoramento', 'CadernoNotas', 'BaseConhecimento', 
            'AgronomistLink', 'CreateRecommendation', 'RecommendationsList'
        ]
    },
    'STAFF': {
        all: false,
        financial: false,
        settings: false,
        governance: false,
        operational: true,
        modules: [
            'Home', 'Monitoramento', 'Plantio', 'Colheita', 'Estoque', 
            'Irrigacao', 'Fertirrigacao', 'Aplicacoes', 'RecommendationsList'
        ]
    }
};

const normalizeRole = (role) => {
    if (!role) return 'CLIENTE';
    const r = role.toUpperCase().trim();
    if (r === 'ADMIN' || r === 'ADM' || r === 'ADMINISTRADOR') return 'ADMIN';
    if (r === 'AGRONOMO' || r === 'AGRÔNOMO') return 'AGRONOMO';
    if (r === 'STAFF' || r === 'GERENTE' || r === 'CAPATAZ' || r === 'OPERADOR') return 'STAFF';
    return 'CLIENTE';
};

export const PermissionService = {
    canAccess: (userRole, screenName) => {
        const normalized = normalizeRole(userRole);
        const permissions = ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS['STAFF'];
        
        if (permissions.all) return true;
        if (permissions.modules && permissions.modules.includes(screenName)) return true;
        
        // Telas de livre acesso para qualquer usuário logado
        const publicScreens = ['Splash', 'Login', 'Profile', 'Home'];
        if (publicScreens.includes(screenName)) return true;
        
        return false;
    },

    isFinancialVisible: (userRole) => {
        const normalized = normalizeRole(userRole);
        const permissions = ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS['STAFF'];
        return !!permissions.financial;
    },

    isSettingsVisible: (userRole) => {
        const normalized = normalizeRole(userRole);
        const permissions = ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS['STAFF'];
        return !!permissions.settings;
    }
};

