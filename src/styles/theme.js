export const theme = {
    colors: {
        // Primárias
        primary: '#10B981',      // Agro Emerald
        primaryDeep: '#064E3B',  // Deep Forest
        accent: '#F59E0B',       // Amber

        // Neutras / Backgrounds
        bg: '#F3F4F6',           // Field Gray
        background: '#F3F4F6',   // Alias para compatibilidade
        card: '#FFFFFF',         // Paper White
        surface: '#FFFFFF',      // Alias
        
        // Texto
        text: '#1F2937',         // Text Dark
        textDark: '#1F2937',     
        textMuted: '#6B7280',    
        textLight: '#9CA3AF',

        // Outros
        border: '#D1D5DB',       

        // Feedback
        error: '#EF4444',        
        warning: '#F59E0B',      
        info: '#3B82F6',         
        success: '#10B981',      
    },
    // Novos modos estendidos para suporte a temas Claro e Escuro
    light: {
        primary: '#059669',      // Emerald 600
        primaryDeep: '#064E3B',
        accent: '#D4AF37',       // Dourado Agro
        background: '#F8FAFC',   // Slate 50 (White-Ice)
        card: '#FFFFFF',         // Branco Puro
        text: '#0F172A',         // Slate 900
        textMuted: '#64748B',    // Slate 500
        border: '#E2E8F0',       // Slate 200
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
    },
    dark: {
        primary: '#10B981',      // Emerald 500
        primaryDeep: '#022C22',  // Cyber Deep Green
        accent: '#D4AF37',       // Dourado Agro
        background: '#020617',   // Slate 950 (Midnight-Slate)
        card: '#0F172A',         // Slate 900
        text: '#F8FAFC',         // Slate 50
        textMuted: '#94A3B8',    // Slate 400
        border: '#1E293B',       // Slate 800
        error: '#F87171',
        warning: '#F59E0B',
        success: '#10B981',
    },
    // Métricas / Spacing
    metrics: {
        radius: 12,
        inputHeight: 50,
        buttonHeight: 50,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    typography: {
        h1: { fontSize: 24, fontWeight: '900' },
        h2: { fontSize: 20, fontWeight: 'bold' },
        body: { fontSize: 14, fontWeight: 'normal' },
        caption: { fontSize: 12, fontWeight: '600' },
    }
};

