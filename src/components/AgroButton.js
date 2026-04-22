import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

export default function AgroButton({ 
    onPress, title, icon, variant = 'primary', loading = false, disabled = false, style, textStyle 
}) {
    const { colors } = useTheme();

    // Secondary = Transparente com borda
    const isSecondary = variant === 'secondary';
    const isDanger = variant === 'danger';

    const getColors = () => {
        if (disabled) return { bg: ['#334155', '#334155'], text: '#94A3B8', border: 'transparent' };
        if (isDanger) return { bg: ['transparent', 'transparent'], text: colors.error, border: colors.error };
        if (isSecondary) return { bg: ['transparent', 'transparent'], text: colors.textMain, border: colors.border };
        
        // Primary Gradiente AgroGB Escuro -> Claro do botao
        return { bg: [colors.accent, '#22C55E'], text: '#FFFFFF', border: 'transparent' };
    };

    const c = getColors();

    const Content = () => (
        <View style={styles.contentWrap}>
            {loading ? (
                <ActivityIndicator color={c.text} size="small" />
            ) : (
                <>
                    {icon && <Ionicons name={icon} size={20} color={c.text} style={styles.iconSpaced} />}
                    <Text style={[styles.title, { color: c.text }, textStyle]}>{title}</Text>
                </>
            )}
        </View>
    );

    const baseWrapperStyle = [
        styles.buttonBase,
        {
            borderColor: c.border,
            borderWidth: (isSecondary || isDanger) ? 1 : 0
        },
        style
    ];

    return (
        <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8} style={baseWrapperStyle}>
            {(!isSecondary && !isDanger && !disabled) ? (
                <LinearGradient colors={c.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill}>
                    <Content />
                </LinearGradient>
            ) : (
                <View style={styles.gradientFill}>
                    <Content />
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    buttonBase: {
        borderRadius: 14, // 12-16px as requested
        overflow: 'hidden',
        minHeight: 50,
        justifyContent: 'center',
    },
    gradientFill: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    contentWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    iconSpaced: {
        marginRight: 8
    }
});
