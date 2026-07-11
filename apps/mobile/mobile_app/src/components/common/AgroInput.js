import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
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
    editable = true,
    ...props
}) {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isDark = theme?.theme_mode === 'dark';
    const activeColors = theme?.colors || {};
    const primaryColor = activeColors.primary || '#10B981';
    
    // Novas Regras Rigorosas de UI/UX (Clean Premium)
    // TEMA CLARO: Fundo branco, Borda D1D1D6, Texto Escuro, Placeholder 8E8E93
    // TEMA ESCURO: Fundo 1C1C1E, Borda 3A3A3C, Texto Branco, Placeholder AEAEB2
    
    const inputBg = isDark ? '#1C1C1E' : '#FFFFFF';
    const borderColor = error ? '#EF4444' : isFocused ? primaryColor : (isDark ? '#3A3A3C' : '#D1D1D6');
    const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
    const placeholderColor = isDark ? '#AEAEB2' : '#8E8E93';
    const labelColor = isDark ? '#AEAEB2' : '#6B7280';
    
    const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={[styles.label, { color: labelColor }]}>
                    {label.toUpperCase()}
                </Text>
            )}

            <View style={[
                styles.inputContainer, 
                { 
                    borderColor: borderColor, 
                    backgroundColor: !editable ? (isDark ? '#2C2C2E' : '#F5F5F7') : inputBg,
                    borderWidth: isFocused ? 2 : 1,
                }
            ]}>
                {icon && (
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={isFocused ? primaryColor : placeholderColor} 
                        style={styles.icon} 
                    />
                )}
                
                <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderColor}
                    secureTextEntry={actualSecureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    editable={editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color={placeholderColor} />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
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
        paddingHorizontal: 15,
        height: 55,
        borderRadius: 12,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        height: '100%',
    },
    eyeIcon: {
        padding: 5,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        color: '#EF4444'
    }
});
