import { StyleSheet } from 'react';

// AgroGB v2.0 - Dark Premium Design System
export const colors = {
    bg: '#080E17',           // Azul petróleo MUITO escuro
    bgCard: '#111A27',       // Cards pouco mais claros que o fundo
    bgInput: '#1A2436',      // Inputs um pouco mais destacados
    
    primary: '#10B981',      // Verde brilhante
    primaryDark: '#047857',
    primaryGlow: '#34D399',  // Glow verde
    
    blue: '#3B82F6',         // Ações secundárias
    danger: '#EF4444',       // Perigo
    warning: '#F59E0B',      // Alerta
    
    border: '#1F2937',       // Contorno suave
    borderFocus: '#10B981',
    
    text: '#F8FAFC',         // Branco Gelo
    textMuted: '#94A3B8',    // Cinza claro
    
    iconWhite: '#FFFFFF',
    iconColor: '#10B981',
};

export const shadows = {
    soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    glow: {
        shadowColor: colors.primaryGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    }
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.soft,
    },
    input: {
        backgroundColor: colors.bgInput,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 54,
        fontSize: 16,
        color: colors.text,
        marginBottom: 16,
    },
    inputFocus: {
        borderColor: colors.borderFocus,
        ...shadows.glow,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.glow,
    },
    buttonSecondary: {
        backgroundColor: colors.blue,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDanger: {
        backgroundColor: colors.danger,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonTextOutline: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
    }
});
