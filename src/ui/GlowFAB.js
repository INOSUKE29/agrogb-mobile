import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK } from '../styles/darkTheme';

export default function GlowFAB({ onPress, icon = 'add', size = 28, style }) {
    return (
        <TouchableOpacity style={[styles.fab, style]} onPress={onPress} activeOpacity={0.85}>
            <Ionicons name={icon} size={size} color={DARK.bg} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: DARK.glow,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00FF9C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
    },
});
