// ============================================================
// SOFT SHADOW MODERNO – Design System Tokens
// AgroGB Mobile v8.1
// Inspirado em: SaaS agrícola premium, dashboard fintech limpo
// ============================================================

export const DARK = {
    // Backgrounds - Tema Claro (apesar do nome da const ser DARK por legado)
    bg: '#F8FAFC',
    bgGradient: ['#4CAF50', '#2E7D32'],
    card: '#FFFFFF',
    cardAlt: '#F1F5F9',
    modal: '#FFFFFF',

    // Primary accent (verde agrícola profissional)
    glow: '#2E7D32',
    glowSoft: '#4CAF50',
    glowBorder: 'rgba(0,0,0,0.05)',
    glowBorderStrong: 'rgba(46,125,50,0.3)',
    glowShadow: 'rgba(46,125,50,0.15)',

    // Text - Letras escuras para contraste no fundo claro
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    placeholder: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    // Status / Financial
    danger: '#EF4444',
    dangerGradient: ['#F87171', '#DC2626'],
    warning: '#F59E0B',
    warningDark: '#B45309',

    // Header separator
    glowLine: 'rgba(255,255,255,0.3)',
};

// Card shadow — branco com sombra suave expandida
export const GLOW_CARD_SHADOW = {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
};

// Sombra forte para modais
export const STRONG_SHADOW = {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
};

export const MODAL_OVERLAY = 'rgba(15,23,42,0.4)';

// Gradiente do fundo principal para a prop backgroundColor de linears
export const BG_GRADIENT = ['#F8FAFC', '#F1F5F9'];
