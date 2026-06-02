import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function GlowCard({ children, style }) {
    const { colors, isDark } = useTheme();

    const cardStyle = [
        styles.card,
        { 
            backgroundColor: colors.card, 
            borderColor: isDark ? colors.border : 'rgba(0,0,0,0.04)',
        },
        Platform.OS === 'web' && {
            boxShadow: isDark ? 'none' : '0px 4px 8px rgba(0, 0, 0, 0.1)'
        },
        !isDark && Platform.OS !== 'web' && {
            shadowColor: '#000',
        },
        style
    ];

    return (
        <View style={cardStyle}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
});
