import React from 'react';
import { COLORS } from '../../styles/theme';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function AppButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary', // primary, secondary, danger, glass, ghost
    style,
    textStyle
}) {
    const { colors, themeParams } = useTheme();

    const getBackgroundColor = () => {
        if (disabled) return colors.gray500;
        switch (variant) {
            case 'secondary': return 'transparent'; // Often transparent with border
            case 'ghost': return 'transparent';
            case 'danger': return colors.destructive;
            case 'glass': return themeParams.glass ? colors.glass : colors.surface;
            default: return colors.primary;
        }
    };

    const getBorderColor = () => {
        if (variant === 'secondary' || variant === 'ghost' || variant === 'glass') return colors.glassBorder;
        return 'transparent';
    };

    const getTextColor = () => {
        if (disabled) return colors.textSecondary;
        if (variant === 'secondary' || variant === 'ghost') return colors.white; // Usually white on dark bg
        if (variant === 'glass') return colors.primaryLight;
        return colors.white;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: (variant === 'secondary' || variant === 'glass' || variant === 'ghost') ? 1 : 0,
                    borderRadius: themeParams.radius, // Dynamic Radius
                    elevation: themeParams.cardElevation
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
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
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
