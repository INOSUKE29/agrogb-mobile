import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

/**
 * AgroFAB — Floating Action Button v10
 * Seguindo o padrão Corporate Elite UI
 */
export default function AgroFAB({ onPress, icon = 'add', style }) {
    const { colors } = useTheme();
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () => Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 8,
        tension: 100
    }).start();

    const pressOut = () => Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100
    }).start();

    return (
        <Animated.View style={[styles.wrap, { transform: [{ scale }] }, style]}>
            <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={0.9}
            >
                <Ionicons name={icon} size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    btn: {
        width: 60,
        height: 60,
        borderRadius: 20, // Squircle style
        justifyContent: 'center',
        alignItems: 'center',
    },
});
