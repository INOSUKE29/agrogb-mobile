import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

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
    icon, // Nome do ícone Ionicons
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Cor da borda dinâmica (com fallbacks seguros)
    const borderColor = error
        ? (theme?.colors?.error || '#EF4444')
        : isFocused
            ? (theme?.colors?.primary || '#10B981')
            : '#E5E7EB';

    const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}

            <View style={[styles.inputContainer, { borderColor: borderColor }]}>
                {icon && <Ionicons name={icon} size={20} color={isFocused ? (theme?.colors?.primary || '#10B981') : '#9CA3AF'} style={styles.icon} />}
                
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={actualSecureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        padding: 5,
    },
    errorText: {
        color: theme?.colors?.error || '#EF4444',
        fontSize: 12,
        marginTop: 4,
    }
});

