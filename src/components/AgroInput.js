import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

// Dark theme colors — hardcoded to avoid undefined theme import
const C = {
    bg: '#111827',
    border: '#334155',
    borderFocus: '#22C55E',
    borderError: '#EF4444',
    text: '#F9FAFB',
    placeholder: '#9CA3AF',
    label: '#9CA3AF',
    error: '#EF4444',
};

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
    style,
    multiline,
    numberOfLines,
}) {
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
        ? C.borderError
        : isFocused
            ? C.borderFocus
            : C.border;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}

            <TextInput
                style={[
                    styles.input,
                    { borderColor },
                    multiline && { height: (numberOfLines || 4) * 42, textAlignVertical: 'top', paddingTop: 14 },
                    isFocused && { borderColor: C.borderFocus, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={C.placeholder}
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

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        width: '100%',
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        color: C.label,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    input: {
        height: 54,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 15,
        color: C.text,
    },
    errorText: {
        color: C.error,
        fontSize: 12,
        marginTop: 4,
    }
});
