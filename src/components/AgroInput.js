import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';

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
    style
}) {
    const [isFocused, setIsFocused] = useState(false);

    // Cor da borda dinâmica — usando COLORS (já importado)
    const borderColor = error
        ? COLORS.destructive
        : isFocused
            ? COLORS.primary
            : COLORS.glassBorder;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}

            <TextInput
                style={[
                    styles.input,
                    { borderColor: borderColor }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray500}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                maxLength={maxLength}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        width: '100%',
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.gray500,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    input: {
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: COLORS.white,
    },
    errorText: {
        color: COLORS.destructive,
        fontSize: 12,
        marginTop: 4,
    }
});
