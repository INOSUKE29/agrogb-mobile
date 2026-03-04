import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';

/**
 * PrimaryButton — Soft Shadow Moderno
 * Botão verde sólido #1F7A5A com micro‑animação de escala
 */
export default function PrimaryButton({ title, onPress, loading, style, textStyle, icon }) {
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
    const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                style={styles.btn}
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={0.85}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={[styles.label, textStyle]}>{title}</Text>
                }
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    btn: {
        backgroundColor: '#1F7A5A',
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
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
