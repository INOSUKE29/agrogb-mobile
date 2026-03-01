/**
 * AGROGB — DARK PREMIUM THEME
 * Identidade visual oficial baseada no logo da marca.
 * Fundo escuro tecnológico + verde neon + azul tech.
 */

export const D = {
    // Fundos
    bg: '#0B1220',   // Fundo principal dark
    bgCard: '#1F2937',   // Cards
    bgInput: '#111827',   // Inputs e campos
    bgSec: '#111827',   // Fundo secundário

    // Cores primárias
    green: '#22C55E',   // Verde neon principal
    greenDark: '#16A34A',   // Verde escuro (hover/pressed)
    greenGlow: '#4ADE80',   // Verde glow
    blue: '#3B82F6',   // Azul tecnologia
    blueGlow: '#60A5FA',   // Azul glow

    // Status
    error: '#EF4444',
    warning: '#F59E0B',

    // Bordas
    border: '#334155',
    borderFocus: '#22C55E',

    // Textos
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',

    // Header gradient
    headerGrad: ['#1A3A2A', '#1a3260'],  // verde escuro → azul escuro

    // Sombras
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    shadowGreen: {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
};

/**
 * SHARED STYLES — reuse estes objetos nos StyleSheet.create() de cada tela.
 */
export const DS = {
    // Container geral
    container: {
        flex: 1,
        backgroundColor: D.bg,
    },

    // Card padrão
    card: {
        backgroundColor: D.bgCard,
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: D.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },

    // Input padrão
    input: {
        backgroundColor: D.bgInput,
        borderWidth: 1,
        borderColor: D.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 54,
        fontSize: 15,
        color: D.textPrimary,
    },

    // Label do input
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: D.textSecondary,
        marginBottom: 7,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Botão principal (verde)
    btn: {
        backgroundColor: D.green,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: D.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },

    // Texto do botão
    btnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },

    // Botão secundário (azul)
    btnBlue: {
        backgroundColor: D.blue,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Botão cancelar (cinza escuro)
    btnCancel: {
        backgroundColor: D.bgInput,
        borderWidth: 1,
        borderColor: D.border,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 24,
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: D.green,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: D.green,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
    },

    // Modal overlay
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },

    // Modal container
    modal: {
        backgroundColor: D.bgCard,
        borderRadius: 22,
        padding: 24,
        borderWidth: 1,
        borderColor: D.border,
    },

    // Modal slide-up (bottom sheet)
    modalBottom: {
        backgroundColor: D.bgCard,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: D.border,
        borderBottomWidth: 0,
    },

    // Título do modal
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: D.textPrimary,
        marginBottom: 20,
    },

    // SelectBtn (campo selecionável)
    selectBtn: {
        backgroundColor: D.bgInput,
        borderWidth: 1,
        borderColor: D.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
};
