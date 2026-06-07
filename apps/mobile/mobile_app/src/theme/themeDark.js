export const themeDark = {
    mode: 'dark',
    colors: {
        bg: '#0F172A',                 // Slate Escuro (Premium, não preto puro)
        headerBg: ['#064E3B', '#0F172A'], // Verde profundo fundindo com slate
        card: '#1E293B',               // Caixas mais claras que o fundo
        cardBg: '#1E293B',             // Aliasing
        border: 'rgba(255,255,255,0.05)', // Bordas Suaves
        textMain: '#F8FAFC',           // Textos Claros
        textSub: '#94A3B8',            // Textos Secundários
        accent: '#10B981',             // Verde Ação
        
        // Status Colors Ouro
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        shadow: 'rgba(0,0,0,0.6)', 
        
        // Legacy Support for backward compatibility on non-refactored screens
        primary: '#16A34A',
        background: '#141A1E',
        surface: 'rgba(255,255,255,0.035)',
        textPrimary: '#FFFFFF',
        textSecondary: '#A7B0B5'
    }
};
