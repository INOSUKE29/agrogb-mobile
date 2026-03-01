// ================================================
// AGROGB DESIGN SYSTEM — theme.js
// Paleta e tokens visuais centralizados
// ================================================

export const Colors = {
    primary: '#1F8A5B',
    primaryDark: '#176E46',
    primaryLight: '#27AE60',
    background: '#F4F6F5',
    card: '#FFFFFF',
    textPrimary: '#1E1E1E',
    textSecondary: '#6E6E6E',
    textMuted: '#9CA3AF',
    warning: '#F4B740',
    error: '#E74C3C',
    border: '#D9D9D9',
    inputBg: '#FFFFFF',
    badgePending: '#FEF3C7',
    badgePendingText: '#D97706',
    badgePartial: '#DBEAFE',
    badgePartialText: '#2563EB',
    badgeDone: '#D1FAE5',
    badgeDoneText: '#065F46',
    badgeCanceled: '#FEE2E2',
    badgeCanceledText: '#991B1B',
};

export const Radius = {
    card: 18,
    button: 14,
    input: 14,
    modal: 22,
    badge: 20,
    fab: 32,
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
};

export const Shadow = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    button: {
        shadowColor: '#1F8A5B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
    },
    fab: {
        shadowColor: '#176E46',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
};

// Estilos compartilhados reusáveis
export const SharedStyles = {
    // Header padrão (aplicado via screenOptions no App.js)
    headerStyle: {
        backgroundColor: '#176E46',
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 17,
    },

    // Container geral
    screen: {
        flex: 1,
        backgroundColor: '#F4F6F5',
    },

    // Card padrão
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },

    // Botão principal
    btnPrimary: {
        backgroundColor: '#1F8A5B',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#1F8A5B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
    },
    btnPrimaryText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },

    // Botão secundário
    btnSecondary: {
        backgroundColor: '#F0F4F1',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    btnSecondaryText: {
        color: '#1F8A5B',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },

    // Botão de exclusão
    btnDanger: {
        backgroundColor: '#E74C3C',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    btnDangerText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },

    // Input padrão
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6E6E6E',
        letterSpacing: 0.5,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    inputField: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1E1E1E',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        backgroundColor: '#1F8A5B',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#176E46',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },

    // Badge de status
    badge: (bgColor) => ({
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: bgColor,
        alignSelf: 'flex-start',
    }),
    badgeText: (color) => ({
        fontSize: 11,
        fontWeight: '800',
        color,
    }),
};

// Utilitário para pegar cor de badge por status
export const getStatusBadge = (status) => {
    const map = {
        PENDENTE: { bg: '#FEF3C7', text: '#D97706' },
        PARCIAL: { bg: '#DBEAFE', text: '#2563EB' },
        CONCLUIDA: { bg: '#D1FAE5', text: '#065F46' },
        CANCELADA: { bg: '#FEE2E2', text: '#991B1B' },
        ATIVO: { bg: '#D1FAE5', text: '#065F46' },
        INATIVO: { bg: '#F3F4F6', text: '#6B7280' },
    };
    return map[status] || { bg: '#F3F4F6', text: '#6B7280' };
};
