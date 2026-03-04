import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BG_GRADIENT } from '../styles/darkTheme';

/**
 * AppContainer — fundo com gradiente verde agrícola
 * #0F3D2E → #1A6B4A → #4CAF50
 */
export default function AppContainer({ children, style }) {
    return (
        <LinearGradient
            colors={BG_GRADIENT}
            style={[styles.fill, style]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
});
