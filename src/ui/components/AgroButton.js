import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { RADIUS } from '../theme/radius';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

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
                    borderWidth: variant === 'secondary' ? 1 : 0,
                    shadowColor: colors.primary,
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
                    {displayTitle.toUpperCase()}
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
