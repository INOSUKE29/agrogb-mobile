import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function AgroInput({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    error,
    autoCapitalize = 'sentences',
    maxLength,
    multiline = false,
    numberOfLines = 1,
    style
}) {
    const { colors, isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
        ? colors.danger
        : isFocused
            ? colors.primary
            : colors.glassBorder;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}

            <TextInput
                style={[
                    styles.input,
                    {
                        borderColor: borderColor,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                        color: colors.text
                    }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.placeholder}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={numberOfLines}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

import { RADIUS } from '../theme/radius';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.lg,
        width: '100%',
    },
    label: {
        fontSize: TYPOGRAPHY.size.xxs,
        fontWeight: TYPOGRAPHY.weight.black,
        color: '#64748B', // Mantendo ardcoat por enquanto para labels secundários ou usando colors.textMuted
        marginBottom: SPACING.sm,
        letterSpacing: 1,
    },
    input: {
        height: 54,
        borderWidth: 1.5,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.semibold,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: TYPOGRAPHY.size.xxs,
        marginTop: SPACING.xs,
        fontWeight: TYPOGRAPHY.weight.bold
    }
});
