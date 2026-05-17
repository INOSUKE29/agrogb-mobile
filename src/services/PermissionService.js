/**
 * PermissionService.js
 * Gerencia níveis de acesso e visibilidade de módulos baseado no cargo.
 */

const ROLE_PERMISSIONS = {
    'ADM': {
        all: true,
        financial: true,
        settings: true,
        governance: true
    },
    'GERENTE': {
        all: false,
        financial: true,
        settings: false,
        governance: true,
        operational: true,
        modules: ['Home', 'Monitoramento', 'FinanceiroDashboard', 'FinanceiroLancamentos', 'Equipes', 'Relatorios', 'Sync']
    },
    'CAPATAZ': {
        all: false,
        financial: false,
        settings: false,
        governance: false,
        operational: true,
        modules: ['Home', 'Monitoramento', 'Plantio', 'Colheita', 'Estoque', 'Irrigacao', 'Fertirrigacao', 'Aplicacoes', 'Frota']
    },
    'OPERADOR': {
        all: false,
        financial: false,
        settings: false,
        governance: false,
        operational: true,
        modules: ['Home', 'Monitoramento', 'Irrigacao', 'Fertirrigacao', 'Aplicacoes']
    }
};

export const PermissionService = {
    canAccess: (userRole, screenName) => {
        let normalizedRole = userRole;
        if (userRole === 'ADMIN' || userRole === 'USUARIO' || userRole === 'ADMINISTRADOR') {
            normalizedRole = 'ADM';
        }
        const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS['OPERADOR'];
        
        if (permissions.all) return true;
        if (permissions.modules && permissions.modules.includes(screenName)) return true;
        
        // Regras genéricas
        if (screenName === 'Splash' || screenName === 'Login' || screenName === 'Profile') return true;
        
        return false;
    },

    isFinancialVisible: (userRole) => {
        let normalizedRole = userRole;
        if (userRole === 'ADMIN' || userRole === 'USUARIO' || userRole === 'ADMINISTRADOR') {
            normalizedRole = 'ADM';
        }
        const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS['OPERADOR'];
        return !!permissions.financial;
    }
};
