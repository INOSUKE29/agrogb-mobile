import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK } from '../styles/darkTheme';

export default function ScreenHeader({ title, onBack, rightElement, style }) {
    return (
        <View style={[styles.wrapper, style]}>
            <View style={styles.row}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={DARK.textPrimary} />
                    </TouchableOpacity>
                ) : <View style={styles.backBtn} />}

                <Text style={styles.title} numberOfLines={1}>{title}</Text>

                <View style={styles.backBtn}>
                    {rightElement || null}
                </View>
            </View>
            {/* Glow line separator */}
            <View style={styles.glowLine} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingTop: 52,
        paddingBottom: 12,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: DARK.textPrimary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    glowLine: {
        height: 1,
        backgroundColor: DARK.glowLine,
        marginTop: 12,
        shadowColor: '#00FF9C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
});
