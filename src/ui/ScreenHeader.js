import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

/**
 * ScreenHeader — Moderno e Dinâmico v8
 */
export default function ScreenHeader({ title, onBack, rightElement }) {
    const { colors, effectiveTheme } = useTheme();

    const isLight = effectiveTheme === 'light';

    return (
        <View style={[styles.header, { backgroundColor: colors.glass || (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)') }]}>
            <View style={styles.row}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} style={[styles.back, { backgroundColor: (colors.border || '#1E8E5A') + '20' }]}>
                        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backDim} />
                )}

                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>

                <View style={styles.right}>
                    {rightElement}
                    {!rightElement && <View style={styles.backDim} />}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 54,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
    },
    back: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backDim: {
        width: 38,
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    right: {
        minWidth: 38,
        alignItems: 'flex-end',
        justifyContent: 'center',
    }
});
