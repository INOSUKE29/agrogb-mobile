import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DARK, GLOW_CARD_SHADOW } from '../styles/darkTheme';

export default function GlowCard({ children, style }) {
    return (
        <View style={[styles.card, GLOW_CARD_SHADOW, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: DARK.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: DARK.glowBorder,
    },
});
