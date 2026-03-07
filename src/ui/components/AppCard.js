import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function AppCard({ children, variant = 'default', style }) {
    const { colors } = useTheme();

    const getVariantStyle = () => {
        if (variant === 'glass') {
            return {
                backgroundColor: colors.glass || 'rgba(255,255,255,0.1)',
                borderColor: colors.glassBorder,
                borderWidth: 1
            };
        }
        if (variant === 'danger') {
            return {
                backgroundColor: 'rgba(214, 69, 69, 0.1)',
                borderColor: colors.danger || '#EF4444',
                borderWidth: 1
            };
        }
        return {
            backgroundColor: colors.card || colors.surface,
            borderColor: colors.glassBorder,
            borderWidth: 1
        };
    };

    const cardStyle = {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        ...getVariantStyle()
    };

    return (
        <View style={[cardStyle, style]}>
            {children}
        </View>
    );
}
