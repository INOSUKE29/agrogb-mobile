import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * SafeBlurView - Componente de Blur Multiplataforma Resiliente 🌌✨
 * Garante efeito translúcido (Glassmorphism) impecável no iOS/Android 
 * e fallback suave no Web para não quebrar o layout.
 */
export default function SafeBlurView({ intensity = 20, tint = 'default', style, webFallbackColor, children, ...props }) {
    // Web fallback premium
    if (Platform.OS === 'web') {
        const fallbackBg = webFallbackColor || (tint === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.45)');
        return (
            <View style={[style, { backgroundColor: fallbackBg }]} {...props}>
                {children}
            </View>
        );
    }

    // Android/iOS Native Blur
    // O Expo BlurView resolve o efeito nativamente. No Android, aplica fallback de transparência interna automática caso o hardware não suporte.
    return (
        <BlurView intensity={intensity} tint={tint} style={style} {...props}>
            {children}
        </BlurView>
    );
}
