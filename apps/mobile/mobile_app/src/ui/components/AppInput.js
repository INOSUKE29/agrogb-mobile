import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const AppInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    multiline,
    numberOfLines,
    error,
    maxLength
}) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                        borderColor: error ? colors.danger : colors.border,
                        textAlignVertical: multiline ? 'top' : 'center',
                    }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                numberOfLines={numberOfLines}
                maxLength={maxLength}
            />
            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 16, width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    error: { fontSize: 12, marginTop: 4, marginLeft: 4 }
});

export default AppInput;
