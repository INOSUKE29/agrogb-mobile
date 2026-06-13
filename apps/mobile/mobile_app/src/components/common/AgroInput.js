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
}) {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Cores Dinâmicas baseadas no Tema Ativo
    const activeColors = theme?.colors || {};
    const isDark = theme?.dark || false;
    
    // Fallbacks para Dark Premium ou Claro
    const inputBg = !editable 
        ? (isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB')
        : (activeColors.inputBg || (isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF'));
        
    const placeholderColor = isDark ? '#6B7280' : '#9CA3AF';
    const textColor = activeColors.inputText || (isDark ? '#F3F4F6' : '#1F2937');
    const labelColor = activeColors.textMuted || (isDark ? '#9CA3AF' : '#6B7280');
    
    const borderColor = error
        ? (activeColors.error || '#EF4444')
        : isFocused
            ? (activeColors.primary || '#10B981')
            : (activeColors.inputBorder || (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'));

    const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

    // Métricas padronizadas compartilhadas com AgroButton
    const standardHeight = theme?.metrics?.buttonHeight || 55;
    const standardRadius = theme?.metrics?.radius || 12;

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
                    backgroundColor: inputBg,
                    height: standardHeight,
                    borderRadius: standardRadius,
                    borderWidth: isFocused ? 1.5 : 1, // Destaque extra no foco
                }
            ]}>
                {icon && (
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={isFocused ? (activeColors.primary || '#10B981') : placeholderColor} 
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
                />

                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color={placeholderColor} />
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
        marginBottom: 16, // Espaçamento padronizado
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
        height: '100%',
    },
    eyeIcon: {
        padding: 5,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    }
});

