import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Vibration, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { RADIUS } from '../../theme/radius';
import { SPACING } from '../../theme/spacing';

export default function AgroButton({
    title,
    label,
    onPress,
    variant = 'primary', // primary, secondary, danger
    loading = false,
    disabled = false,
    style
}) {
    const { colors, isDark } = useTheme();

    let bg = colors.primary;
    let txt = colors.textOnPrimary || '#FFF';
    let border = 'transparent';

    const displayTitle = title || label || '';

    if (variant === 'secondary') {
        bg = 'transparent';
        txt = colors.primary;
        border = (colors.primary || '#1E8E5A') + '60';
    } else if (variant === 'danger') {
        bg = (colors.danger || '#EF4444') + '20';
        txt = colors.danger;
    }

    // Estado desativado
    if (disabled) {
        bg = isDark ? '#1E293B' : '#E5E7EB';
        txt = isDark ? '#475569' : '#9CA3AF';
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
                    // Modern shadow for primary buttons
                    shadowColor: variant === 'primary' ? colors.primary : colors.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 8,
                    elevation: variant === 'primary' ? 4 : 0,
                },
                style
            ]}
            onPress={(e) => {
                if (!disabled && !loading) {
                    if (Platform.OS !== 'web') Vibration.vibrate(30); // Micro-vibração
                    if (onPress) onPress(e);
                }
            }}
            activeOpacity={0.7}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={txt} size="small" />
            ) : (
                <Text style={[styles.text, { color: txt }]}>
                    {displayTitle}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 54,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginVertical: SPACING.sm,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});
