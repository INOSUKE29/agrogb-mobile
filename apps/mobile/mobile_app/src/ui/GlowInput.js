import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function GlowInput({ style, ...props }) {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
        <TextInput
            style={[
                styles.input,
                {
                    backgroundColor: colors.card,
                    borderColor: focused ? colors.primary : colors.glassBorder || 'rgba(0,0,0,0.12)',
                    color: colors.textPrimary,
                    borderWidth: focused ? 1.5 : 1
                },
                style,
            ]}
            placeholderTextColor={colors.placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 14,
        fontSize: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    }
});
