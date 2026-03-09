import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const AppCard = ({ children, style, title, subtitle }) => {
    const { colors } = useTheme();

    return (
        <View style={[{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 16
        }, style]}>
            {(title || subtitle) && (
                <View style={{ marginBottom: 12 }}>
                    {title && <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary }}>{title}</Text>}
                    {subtitle && <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
                </View>
            )}
            {children}
        </View>
    );
};
