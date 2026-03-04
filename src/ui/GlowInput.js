import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { DARK } from '../styles/darkTheme';

/**
 * GlowInput — Soft Shadow Moderno
 * Campo branco com borda verde ao focar
 */
export default function GlowInput({ style, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <TextInput
            style={[
                styles.input,
                focused && styles.focused,
                style,
            ]}
            placeholderTextColor={DARK.placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.12)',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 14,
        fontSize: 15,
        color: '#1E293B',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    focused: {
        borderColor: '#1F7A5A',
        borderWidth: 1.5,
    },
});
