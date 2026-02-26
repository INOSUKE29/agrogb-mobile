import React from 'react';
import { COLORS } from '../../styles/theme';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext'; // Dynamic hook
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
    variant = 'glass' // Default intended variant
}) {
    const { colors, themeParams } = useTheme();

    // Check if we should enforce glass look based on Theme Context
    const isGlassMode = themeParams.glass && variant === 'glass';

    return (
        <View style={[styles.inputWrapper, style]}>
            {label && (
                <Text style={[
                    styles.label,
                    { color: isGlassMode ? colors.primaryLight : colors.gray500 }
                ]}>
                    {label}
                </Text>
            )}
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: isGlassMode ? colors.inputBackground : colors.inputBackground,
                    borderColor: colors.glassBorder,
                    borderRadius: themeParams.radius, // Dynamic Radius
                    height: themeParams.inputHeight
                }
            ]}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isGlassMode ? colors.primaryLight : colors.primary}
                        style={{ marginRight: 10 }}
                    />
                )}
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.gray500}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
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
