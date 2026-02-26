import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../styles/theme';

export default function AgroButton({
    title,
    onPress,
    variant = 'primary', // primary, secondary, danger
    loading = false,
    disabled = false,
    style
}) {
    // Define cores com base na variante
    let bg = COLORS.primary;
    let txt = '#FFF';
    let border = 'transparent';

    if (variant === 'secondary') {
        bg = 'transparent';
        txt = COLORS.primaryDark;
        border = COLORS.primary;
    } else if (variant === 'danger') {
        bg = '#FEE2E2';
        txt = COLORS.destructive;
    }

    // Estado desativado
    if (disabled) {
        bg = '#E5E7EB';
        txt = '#9CA3AF';
        border = 'transparent';
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: bg, borderColor: border, borderWidth: variant === 'secondary' ? 1 : 0 },
                style
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
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    text: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
