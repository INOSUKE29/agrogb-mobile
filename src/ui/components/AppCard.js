import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function AppCard({ children, variant = 'default', style }) {
    const { colors, themeParams } = useTheme();

    const getVariantStyle = () => {
        if (variant === 'glass' || (themeParams.glass && variant === 'default')) {
            if (!themeParams.glass) {
                return {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                    borderWidth: 1
                }
            }
            return {
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
                borderWidth: 1
            };
        }
        if (variant === 'danger') {
            return {
                backgroundColor: 'rgba(214, 69, 69, 0.1)',
                borderColor: colors.destructive,
                borderWidth: 1
            };
        }
        return {};
    };

    const cardStyle = {
        backgroundColor: colors.surface,
        borderRadius: themeParams.radius,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        elevation: themeParams.cardElevation,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        ...getVariantStyle()
    };

    return (
        <View style={[cardStyle, style]}>
            {children}
        </View>
    );
}
