import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * InputField - Campo de Entrada de Dados Customizado 📝🌾
 * Componente unificado para formulários com visualização de ícones,
 * rótulos legíveis, e suporte de contraste calibrado para ambos os temas.
 */
export default function InputField({ 
    label, icon, value, onChangeText, placeholder, 
    secureTextEntry, keyboardType, maxLength, style, ...props 
}) {
    const { theme } = useTheme();
    const colors = theme?.colors || {};

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: 'rgba(255,255,255,0.6)' }]}>{label}</Text>}
            <View style={[styles.inputContainer, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                {icon && <Ionicons name={icon} size={18} color="rgba(255,255,255,0.4)" style={styles.icon} />}
                <TextInput
                    style={[styles.input, { color: '#FFF' }, style]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    autoCapitalize="none"
                    {...props}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15, fontWeight: '600' }
});
