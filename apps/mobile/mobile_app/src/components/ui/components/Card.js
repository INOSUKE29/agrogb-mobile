import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SHADOWS } from '../theme/shadows';
import { RADIUS } from '../theme/radius';
import { SPACING } from '../theme/spacing';

export const Card = ({ children, style, onPress, noPadding = false }) => {
    const { colors, isDark } = useTheme();

    const Component = onPress ? TouchableOpacity : View;

    return (
        <Component
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: isDark ? 1 : 1,
                    shadowColor: isDark ? 'transparent' : colors.shadow,
                },
                !isDark && SHADOWS.light,
                !noPadding && styles.padding,
                style
            ]}
        >
            {children}
        </Component>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.md,
        overflow: 'hidden'
    },
    padding: {
        padding: SPACING.md,
    }
});
