import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function AgroCard({ children, onPress, style, noPadding = false }) {
    const { colors } = useTheme();

    const cardStyles = [
        styles.cardBase,
        {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            shadowColor: colors.shadow || '#000',
        },
        !noPadding && styles.withPadding,
        style
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.75}>
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyles}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    cardBase: {
        borderWidth: 1,
        borderRadius: 16,
        // Efeito de Profundidade Dark
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4, 
        overflow: 'hidden'
    },
    withPadding: {
        padding: 16
    }
});
