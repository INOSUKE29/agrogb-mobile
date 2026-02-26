export const COLORS = {
    // Verde Primário (Marca)
    primary: '#1E7F5C',
    primaryDark: '#0F4D3A',
    primaryLight: '#2FA97A',

    // Verde Escuro (Fundo Premium)
    backgroundDark: '#0B3D2E',

    // Azul Tecnologia (Secundária)
    techBlue: '#2C7BE5',

    // Neutros
    gray100: '#F4F6F8', // Cards, BG Light
    gray200: '#E5E9EC', // Bordas
    gray500: '#7A8793', // Texto Secundário
    gray800: '#2E2E2E', // Texto Principal

    // Utilitários
    white: '#FFFFFF',
    destructive: '#D64545',
    success: '#1E7F5C',
    overlay: 'rgba(0,0,0,0.3)',
    glass: 'rgba(255,255,255,0.05)',
    glassBorder: 'rgba(255,255,255,0.1)',

    // Dark Mode Specifics
    surface: '#0F4D3A', // Card background in dark mode
    textOnDark: '#E5E7EB', // Text on dark background
    inputGlass: 'rgba(0, 0, 0, 0.3)' // Input background in dark mode
};

export const FONTS = {
    h1: { fontSize: 28, fontWeight: '600' }, // SemiBold
    h2: { fontSize: 18, fontWeight: '500' }, // Medium
    body: { fontSize: 14, fontWeight: '400' }, // Regular
    button: { fontSize: 16, fontWeight: '500', textTransform: 'uppercase' }
};

export const SPACING = {
    paddingSmall: 8,
    paddingMedium: 16,
    paddingLarge: 24,
    paddingXLarge: 32,
    radius: 18,
    inputHeight: 56
};

// Default export combining everything
export default { COLORS, FONTS, SPACING };
