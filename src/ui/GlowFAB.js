import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * GlowFAB — Floating Action Button
 * Verde #1F7A5A com sombra suave
 */
export default function GlowFAB({ onPress, icon = 'add', style }) {
    const scale = useRef(new Animated.Value(1)).current;
    const pressIn = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, friction: 5 }).start();
    const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

    return (
        <Animated.View style={[styles.wrap, { transform: [{ scale }] }, style]}>
            <TouchableOpacity
                style={styles.btn}
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={0.85}
            >
                <Ionicons name={icon} size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 28,
        right: 22,
    },
    btn: {
        backgroundColor: '#1F7A5A',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
        elevation: 10,
    },
});
