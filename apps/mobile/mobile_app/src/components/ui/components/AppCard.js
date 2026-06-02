import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const AppCard = ({ children, style, title, subtitle }) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: isDark ? '#000' : colors.shadow,
            },
            style
        ]}>
            {(title || subtitle) && (
                <View style={styles.header}>
                    {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
                    {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
                </View>
            )}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24, // Large, modern rounded corners
        padding: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 16,
        borderWidth: 1.5, // Subtle border like premium dashboards
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 0.5,
    }
});
