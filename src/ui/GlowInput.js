import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { DARK } from '../styles/darkTheme';

export default function GlowInput({ style, ...props }) {
    return (
        <TextInput
            placeholderTextColor={DARK.placeholder}
            style={[styles.input, style]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: DARK.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: DARK.glowBorderStrong,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: DARK.textPrimary,
        marginBottom: 14,
    },
});
