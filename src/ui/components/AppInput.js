import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
// Dynamic hook
import { Ionicons } from '@expo/vector-icons';

export function AppInput({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    style,
    variant = 'glass',
    maxLength
}) {
    const { colors } = useTheme();

    return (
        <View style={[styles.inputWrapper, style]}>
            {label && (
                <Text style={[
                    styles.label,
                    { color: colors.textSecondary }
                ]}>
                    {label}
                </Text>
            )}
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: colors.cardAlt || 'rgba(0,0,0,0.05)',
                    borderColor: colors.glassBorder,
                    borderRadius: 12, // Fixed radius
                    height: 52
                }
            ]}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={colors.primary}
                        style={{ marginRight: 10 }}
                    />
                )}
                <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    inputWrapper: {
        marginBottom: 20
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 16
    }
});
