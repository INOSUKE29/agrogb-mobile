import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function GlowCard({ children, style }) {
    const { colors, isDark } = useTheme();

    return (
        <View style={[
            styles.card,
            { 
                backgroundColor: colors.card, 
                borderColor: isDark ? colors.border : 'rgba(0,0,0,0.04)',
                shadowColor: isDark ? 'transparent' : '#000',
            },
            style
        ]}>
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
