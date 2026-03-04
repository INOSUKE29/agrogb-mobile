import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GLOW_CARD_SHADOW } from '../styles/darkTheme';

/**
 * GlowCard — Soft Shadow Moderno
 * Card branco elevado com sombra suave
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
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        ...GLOW_CARD_SHADOW,
    },
});
