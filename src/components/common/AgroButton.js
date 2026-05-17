import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AgroButton({
    title,
    onPress,
    variant = 'primary', // primary, secondary, danger
    loading = false,
    disabled = false,
    style
}) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    const isPrimary = variant === 'primary';
    const isDanger = variant === 'danger';

    // Cores Dinâmicas baseadas no tema e variante
    let bg = activeColors.primary || '#10B981';
    let txt = '#FFFFFF';
    let border = 'transparent';

    if (variant === 'secondary') {
        bg = 'transparent';
        txt = activeColors.primary || '#10B981';
        border = activeColors.primary || '#10B981';
    } else if (variant === 'danger') {
        bg = theme?.theme_mode === 'dark' ? 'rgba(248, 113, 113, 0.15)' : '#FEE2E2';
        txt = activeColors.error || '#EF4444';
    }

    // Estado desativado dinâmico por tema
    if (disabled) {
        bg = theme?.theme_mode === 'dark' ? '#1E293B' : '#E2E8F0';
        txt = theme?.theme_mode === 'dark' ? '#475569' : '#94A3B8';
        border = 'transparent';
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { 
                    backgroundColor: bg, 
                    borderColor: border, 
                    borderWidth: variant === 'secondary' ? 1.5 : 0,
                    borderRadius: theme?.metrics?.radius || 12,
                    height: theme?.metrics?.buttonHeight || 55,
                },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={txt} />
            ) : (
                <Text style={[styles.text, { color: txt }]}>
                    {title.toUpperCase()}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    text: {
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    }
});
