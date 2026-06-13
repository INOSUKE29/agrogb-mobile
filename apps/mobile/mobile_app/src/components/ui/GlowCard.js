import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function GlowCard({ children, style }) {
    const { colors, isDark, metrics } = useTheme();

    const standardRadius = metrics?.cardRadius || 18;

    const cardStyle = [
        styles.card,
        { 
            backgroundColor: colors?.card || (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'), 
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            borderRadius: standardRadius,
        },
        Platform.OS === 'web' && {
            boxShadow: isDark 
                ? '0px 8px 24px rgba(16, 185, 129, 0.05)' // Glow discreto primário no Dark
                : '0px 4px 12px rgba(0, 0, 0, 0.05)'
        },
        Platform.OS !== 'web' && {
            shadowColor: isDark ? (colors?.primary || '#10B981') : '#000',
            shadowOpacity: isDark ? 0.08 : 0.05,
            shadowRadius: isDark ? 12 : 8,
            shadowOffset: { width: 0, height: 4 },
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
        padding: 16,
        borderWidth: 1,
        elevation: 3, // Android shadow
        marginBottom: 16,
    },
});
