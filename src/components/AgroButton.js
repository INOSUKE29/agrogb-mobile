import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Dark theme colors — hardcoded to avoid undefined theme import
const C = {
    primary: '#22C55E',
    primaryDark: '#16A34A',
    error: '#EF4444',
    border: '#334155',
    textGray: '#9CA3AF',
    bgGray: '#1F2937',
};

export default function AgroButton({
    title,
    onPress,
    variant = 'primary', // primary, secondary, danger
    loading = false,
    disabled = false,
    style
}) {
    let bg = C.primary;
    let txt = '#FFF';
    let border = 'transparent';
    let bw = 0;

    if (variant === 'secondary') {
        bg = 'transparent';
        txt = C.primary;
        border = C.primary;
        bw = 1.5;
    } else if (variant === 'danger') {
        bg = '#1a0000';
        txt = C.error;
        border = C.error;
        bw = 1;
    }

    if (disabled) {
        bg = C.bgGray;
        txt = C.textGray;
        border = C.border;
        bw = 1;
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: bg, borderColor: border, borderWidth: bw },
                variant === 'primary' && !disabled && styles.shadow,
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={txt} />
            ) : (
                <Text style={[styles.text, { color: txt }]}>
                    {title ? title.toUpperCase() : ''}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 8,
    },
    shadow: {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    text: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.8,
    }
});
