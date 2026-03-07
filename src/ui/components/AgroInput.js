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
    style
}) {
    const { colors } = useTheme();
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
                    { borderColor: borderColor }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.placeholder}
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
        color: '#6B7280',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    input: {
        height: 50,
        backgroundColor: '#FFF', // fallback, will be dynamic in style prop if needed
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
    }
});
