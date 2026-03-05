import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GLOW_CARD_SHADOW, DARK } from '../styles/darkTheme';

/**
 * GlowCard — Soft Shadow Moderno
 * Card claro elevado com sombra expansiva
 */
export default function GlowCard({ children, style }) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: DARK.card,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        ...GLOW_CARD_SHADOW,
    },
});
