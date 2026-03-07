export const lightTheme = {
    name: "Light (ERP)",
    bg: '#F4F6F8',
    bgGradient: ['#F4F6F8', '#E5E7EB'],
    card: '#FFFFFF',
    cardAlt: '#F1F5F9',
    modal: '#FFFFFF',
    glow: '#2E7D32',
    glowSoft: '#4CAF50',
    glowBorder: 'rgba(0,0,0,0.05)',
    glowBorderStrong: 'rgba(46,125,50,0.3)',
    glowShadow: 'rgba(46,125,50,0.15)',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    placeholder: '#9CA3AF',
    textOnPrimary: '#FFFFFF',
    danger: '#EF4444',
    dangerGradient: ['#F87171', '#DC2626'],
    warning: '#F59E0B',
    warningDark: '#B45309',
    glowLine: 'rgba(255,255,255,0.3)',
    primary: '#2E7D32',
    primaryDark: '#1B5E20',
    glassBorder: '#E5E7EB'
};

export const darkTheme = {
    name: "Dark (Noturno)",
    bg: '#0F172A',
    bgGradient: ['#0F172A', '#1E293B'],
    card: '#1E293B',
    container: '#0F172A',
    cardAlt: '#334155',
    modal: '#1E293B',
    glow: '#22C55E',
    glowSoft: '#10B981',
    glowBorder: 'rgba(255,255,255,0.1)',
    glowBorderStrong: 'rgba(34,197,94,0.3)',
    glowShadow: 'rgba(34,197,94,0.15)',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    placeholder: '#475569',
    textOnPrimary: '#FFFFFF',
    danger: '#F87171',
    dangerGradient: ['#EF4444', '#B91C1C'],
    warning: '#1E293B',
    warningDark: '#F59E0B',
    glowLine: 'rgba(255,255,255,0.1)',
    primary: '#22C55E',
    primaryDark: '#16A34A',
    glassBorder: '#334155'
};

export const agroTheme = {
    name: "AgroGB (Verde)",
    bg: '#F0FDF4',
    bgGradient: ['#059669', '#047857'],
    card: '#FFFFFF',
    cardAlt: '#ECFDF5',
    modal: '#FFFFFF',
    glow: '#059669',
    glowSoft: '#34D399',
    glowBorder: 'rgba(5,150,105,0.1)',
    glowBorderStrong: 'rgba(5,150,105,0.3)',
    glowShadow: 'rgba(5,150,105,0.15)',
    textPrimary: '#064E3B',
    textSecondary: '#065F46',
    textMuted: '#047857',
    placeholder: '#6EE7B7',
    textOnPrimary: '#FFFFFF',
    danger: '#DC2626',
    dangerGradient: ['#EF4444', '#B91C1C'],
    warning: '#D97706',
    warningDark: '#92400E',
    glowLine: 'rgba(255,255,255,0.3)',
    primary: '#059669',
    primaryDark: '#047857',
    glassBorder: 'rgba(5,150,105,0.15)'
};

export const AVAILABLE_THEMES = {
    light: lightTheme,
    dark: darkTheme,
    agrogb: agroTheme
};

export const getThemeColors = (mode) => {
    return AVAILABLE_THEMES[mode] || lightTheme;
};

export const GLOW_CARD_SHADOW = {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
};

export const STRONG_SHADOW = {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
};

export const MODAL_OVERLAY = 'rgba(15,23,42,0.4)';
export const BG_GRADIENT = ['#F8FAFC', '#F1F5F9'];
