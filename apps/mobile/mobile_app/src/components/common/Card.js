import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function Card({ children, style, noPadding = false }) {
    const { theme } = useTheme();

    return (
        <View style={[
            {
                backgroundColor: theme?.colors?.card || '#FFFFFF',
                borderRadius: theme?.metrics?.radius || 12,
                padding: noPadding ? 0 : (theme?.spacing?.md || 16),
                borderColor: theme?.colors?.border || '#E2E8F0',
                borderWidth: theme?.resolved_theme_mode === 'dark' ? 1 : 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme?.resolved_theme_mode === 'dark' ? 0.25 : 0.15,
                shadowRadius: 12,
                elevation: theme?.resolved_theme_mode === 'dark' ? 8 : 6,
                marginBottom: theme?.spacing?.md || 16,
            },
            style
        ]}>
            {children}
        </View>
    );
}
