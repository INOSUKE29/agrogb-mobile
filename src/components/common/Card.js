import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Card({ children, style, noPadding = false }) {
    const { theme } = useTheme();

    return (
        <View style={[
            {
                backgroundColor: theme?.colors?.card || '#FFFFFF',
                borderRadius: theme?.metrics?.radius || 12,
                padding: noPadding ? 0 : (theme?.spacing?.md || 16),
                borderColor: theme?.colors?.border || '#E2E8F0',
                borderWidth: theme?.theme_mode === 'dark' ? 1 : 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme?.theme_mode === 'dark' ? 0.2 : 0.05,
                shadowRadius: 10,
                elevation: 3,
                marginBottom: theme?.spacing?.md || 16,
            },
            style
        ]}>
            {children}
        </View>
    );
}
