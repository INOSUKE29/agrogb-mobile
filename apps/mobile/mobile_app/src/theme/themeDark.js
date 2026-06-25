export const themeDark = {
    mode: 'dark',
    colors: {
        // --- FUNDOS PRINCIPAIS ---
        bg: '#091829',                 // Fundo intermediário (substituto seguro do linear gradient principal)
        bgGradient: ['#06111C', '#091829', '#102235'], // Degradê vertical exigido
        
        // --- CABEÇALHO ---
        headerBg: ['#0D8C39', '#18B34A'], // Gradiente Premium Verde
        
        // --- CARDS E COMPONENTES ---
        card: '#162336',               // Base para cards
        cardKPI: '#142233',            // Cards Superiores
        cardMenu: '#152235',           // Menu Acesso Rápido
        cardBg: '#162336',             // Aliasing
        
        border: 'rgba(255,255,255,0.08)', // Borda branca extremamente discreta
        
        // --- TEXTOS ---
        textMain: '#FFFFFF',           // Textos Claros Premium
        textSub: '#A7B0B5',            // Textos Secundários
        text: '#F8FAFC',               // Sobrescrita legacy
        textDark: '#FFFFFF',           // Sobrescrita legacy
        textMuted: '#94A3B8',          // Sobrescrita legacy
        
        // --- AÇÕES ---
        accent: '#19B34A',             // Verde Ação
        buttonGradient: ['#19B34A', '#2BD76D'],
        
        // --- STATUS ---
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        shadow: 'rgba(0,0,0,0.6)', 
        
        // Legacy Support for backward compatibility
        primary: '#18B34A',
        background: '#091829',
        surface: '#162336',
        textPrimary: '#FFFFFF',
        textSecondary: '#94A3B8'
    }
};
