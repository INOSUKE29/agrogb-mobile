import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function AgroButton({
    title,
    onPress,
    variant = 'primary', // primary, secondary, danger
    loading = false,
    disabled = false,
    style
}) {
    const { colors, isDark } = useTheme();

    let bg = colors.primary;
    let txt = '#FFF';
    let border = 'transparent';

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
                    borderWidth: variant === 'secondary' ? 1 : 0,
                    shadowColor: colors.primary, // Sombra dinâmica vindo do tema
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

import { RADIUS } from '../theme/radius';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

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
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.black,
        letterSpacing: 1.5,
    }
});
