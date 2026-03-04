// ============================================================
// SOFT SHADOW MODERNO – Design System Tokens
// AgroGB Mobile v8.1
// Inspirado em: SaaS agrícola premium, dashboard fintech limpo
// ============================================================

export const DARK = {
    // Backgrounds
    bg: '#0F3D2E',
    bgGradient: ['#0F3D2E', '#1F7A5A', '#4CAF50'],
    card: 'rgba(255,255,255,0.95)',
    cardAlt: 'rgba(255,255,255,0.85)',
    modal: '#FFFFFF',

    // Primary accent (verde agrícola profissional)
    glow: '#1F7A5A',
    glowSoft: '#4CAF50',
    glowBorder: 'rgba(0,0,0,0.08)',
    glowBorderStrong: 'rgba(31,122,90,0.35)',
    glowShadow: 'rgba(31,122,90,0.18)',

    // Text (escuro — cards são claros)
    textPrimary: '#1E293B',
    textSecondary: '#334155',
    textMuted: '#64748B',
    placeholder: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    // Status / Financial
    danger: '#DC2626',
    dangerGradient: ['#EF4444', '#B91C1C'],
    warning: '#D97706',
    warningDark: '#92400E',

    // Header separator
    glowLine: 'rgba(255,255,255,0.25)',
};

// Card shadow — branco com sombra suave
export const GLOW_CARD_SHADOW = {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 6,
};

// Sombra forte para modais
export const STRONG_SHADOW = {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 14,
};

export const MODAL_OVERLAY = 'rgba(0,0,0,0.55)';

// Gradiente do fundo principal
export const BG_GRADIENT = ['#0F3D2E', '#1A6B4A', '#4CAF50'];
