import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * PrimaryButton — Soft Shadow Moderno
 * Botão verde sólido com micro‑animação de escala
 */
export default function PrimaryButton({ title, label, onPress, loading, style, textStyle }) {
    const { colors } = useTheme();
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
    const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();

    const displayTitle = title || label;

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary || '#1F7A5A' }]}
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={0.85}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={[styles.label, { color: colors.textOnPrimary || '#FFF' }, textStyle]}>{displayTitle}</Text>
                }
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    btn: {
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
