import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GLOW_CARD_SHADOW } from '../styles/themes';
import { useTheme } from '../context/ThemeContext';

export default function GlowCard({ children, style }) {
    const { colors } = useTheme();

    return (
        <View style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.glassBorder || 'rgba(0,0,0,0.04)' },
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
        ...GLOW_CARD_SHADOW,
    },
});
