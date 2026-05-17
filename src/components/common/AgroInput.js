import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
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
    icon,
}) {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Cores Dinâmicas baseadas no Tema Ativo
    const activeColors = theme?.colors || {};
    const inputBg = theme?.theme_mode === 'dark' ? '#070D19' : '#FFFFFF';
    
    const borderColor = error
        ? (activeColors.error || '#EF4444')
        : isFocused
            ? (activeColors.primary || '#10B981')
            : (activeColors.border || '#E2E8F0');

    const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={[styles.label, { color: activeColors.textMuted || '#6B7280' }]}>
                    {label.toUpperCase()}
                </Text>
            )}

            <View style={[
                styles.inputContainer, 
                { 
                    borderColor: borderColor, 
                    backgroundColor: inputBg 
                }
            ]}>
                {icon && (
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={isFocused ? (activeColors.primary || '#10B981') : '#9CA3AF'} 
                        style={styles.icon} 
                    />
                )}
                
                <TextInput
                    style={[styles.input, { color: activeColors.text || '#1F2937' }]}
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

            {error && (
                <Text style={[styles.errorText, { color: activeColors.error || '#EF4444' }]}>
                    {error}
                </Text>
            )}
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
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
    },
    eyeIcon: {
        padding: 5,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    }
});

