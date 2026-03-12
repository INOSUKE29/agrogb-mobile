import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function AppButton({
    title,
    label,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary', // primary, secondary, danger, glass, ghost
    style,
    textStyle
}) {
    const { colors } = useTheme();

    const displayTitle = title || label || '';

    const getBackgroundColor = () => {
        if (disabled) return colors.placeholder;
        switch (variant) {
            case 'secondary': return 'transparent';
            case 'ghost': return 'transparent';
            case 'danger': return colors.danger;
            case 'glass': return colors.card;
            default: return colors.primary;
        }
    };

    const getBorderColor = () => {
        if (variant === 'secondary' || variant === 'ghost' || variant === 'glass') return colors.glassBorder || colors.glowBorder;
        return 'transparent';
    };

    const getTextColor = () => {
        if (disabled) return colors.textSecondary;
        if (variant === 'secondary' || variant === 'ghost') return colors.textPrimary;
        if (variant === 'glass') return colors.primary;
        return colors.textOnPrimary;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: (variant === 'secondary' || variant === 'glass' || variant === 'ghost') ? 1 : 0,
                    borderRadius: 12,
                    elevation: 4
                },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{displayTitle}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        marginBottom: 10
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase'
    }
});
