/**
 * AGROGB MOBILE - MAPA DE ARQUITETURA IMUTÁVEL (FONTE DE VERDADE)
 * Este arquivo serve como referência funcional e técnica para a reconstrução e evolução do sistema.
 * Versão: 1.0.0 (Baseada na Auditoria Forense de Maio/2026)
 */

export const ArchitectureMap = {
    vision: "Plataforma de Gestão Rural Premium (Morango e Multi-Culturas)",
    core_stack: ["Expo SDK 50", "React Native", "Supabase", "SQLite (Offline-First)"],
    
    modules: {
        AUTH: {
            screens: ["Login", "Register", "ForgotPassword", "Recover", "VerifyCode", "ResetPassword"],
            features: ["Biometria", "SecureStore Credentials", "Supabase Auth"]
        },
        OPERACIONAL: {
            screens: ["Plantio", "Monitoramento", "Irrigacao", "Fertirrigacao", "Colheita", "CadernoCampo"],
            sub_modules: {
                ADUBACAO: {
                    screens: ["AdubacaoList", "AdubacaoForm", "AdubacaoDetail", "PlanoAdubacao"],
                    logic: "Cálculo NPK, Custo/Ha, Prescrição Agronômica"
                }
            }
        },
        ADMINISTRATIVO: {
            screens: ["Estoque", "Compras", "Vendas", "Clientes", "Fornecedores", "Talhoes", "Frota", "Equipes"],
            features: ["Baixa Automática por Receita", "Horímetro Frota", "Gestão de Insumos"]
        },
        FINANCEIRO: {
            screens: ["FinanceiroLancamentos", "FinanceiroDashboard", "CentroCustos"],
            features: ["Fluxo de Caixa", "DRE", "Resultado por Período"]
        },
        SISTEMA: {
            screens: ["Profile", "BIRelatoriosAvancados", "Sync", "Audit", "Settings", "Relatorios"],
            features: ["AutoSync Background", "Backup SQL/JSON", "Audit Logs", "Exportação PDF/XLSX"]
        },
        INTELIGENCIA: {
            screens: ["Intelligence", "Ocr", "Scanner"],
            features: ["Diagnóstico IA", "Predição de Safra", "OCR de Notas Fiscais"]
        }
    },

    historical_peaks: {
        enterprise_version: "Commit 665dd3c (09/04/2026)",
        diamond_pro: "Builds #107/108 (Assinatura Nativa)"
    },

    rules_of_truth: [
        "A lógica offline-first no SQLite é mandatória antes do Sync.",
        "Nenhuma funcionalidade histórica deve ser removida em refatorações futuras.",
        "O design system deve seguir o padrão 'Cyber Emerald' / 'Senior Glassmorphism'.",
        "Todas as transações críticas devem gerar Audit Logs."
    ]
};

export default ArchitectureMap;
