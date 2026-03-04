import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * ScreenHeader — Soft Shadow Moderno
 * Header translúcido sobre gradiente verde com linha separadora
 */
export default function ScreenHeader({ title, navigation, rightIcon, onRightPress }) {
    return (
        <View style={styles.header}>
            <View style={styles.row}>
                {navigation ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.back} />
                )}

                <Text style={styles.title} numberOfLines={1}>{title}</Text>

                {rightIcon ? (
                    <TouchableOpacity onPress={onRightPress} style={styles.right}>
                        <Ionicons name={rightIcon} size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.right} />
                )}
            </View>
            <View style={styles.separator} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 52,
        paddingBottom: 14,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(15,61,46,0.6)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    back: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginHorizontal: 8,
    },
    right: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 14,
    },
});
