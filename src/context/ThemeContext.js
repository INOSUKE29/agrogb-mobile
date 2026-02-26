import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import staticTheme from '../styles/theme'; // Fallback base

const THEME_KEY = '@agrogb:theme_v2'; // New key for V2 structure

// Theme Definitions
const THEMES = {
    light_standard: {
        name: 'Claro (Padrão)',
        isDark: false,
        colors: {
            // Verde Agro Clássico
            primary: '#10B981',
            primaryDark: '#059669',
            primaryLight: '#34D399',
            background: '#FFFFFF', // Fundo Branco
            backgroundDark: '#F3F4F6', // Cinza Claro p/ contrastes leves
            surface: '#FFFFFF', // Cards Brancos
            glass: '#FFFFFF',
            glassBorder: '#E5E7EB', // Borda Cinza Clara
            text: '#1F2937', // Texto Escuro (Preto Suave)
            textSecondary: '#6B7280', // Texto Secundário (Cinza)
            textOnDark: '#FFFFFF', // Texto quando estiver sobre cor forte (botão verde)
            inputBackground: '#F9FAFB',
            destructive: '#EF4444',
            white: '#FFFFFF',
            accent: '#FCD34D',
            gray500: '#6B7280',
            success: '#10B981',
            // Aliases de legibilidade
            border: '#E5E7EB',
            card: '#FFFFFF',
            error: '#EF4444'
        },
        params: {
            radius: 12,
            glass: false,
            inputHeight: 56,
            cardElevation: 2
        }
    },
    ultra_premium: {
        name: 'Ultra-Premium (Vidro)',
        isDark: true,
        colors: {
            // Dark Green Premium
            primary: '#1E7F5C',
            primaryDark: '#0F4D3A',
            primaryLight: '#2FA97A',
            background: '#0B3D2E', // Deep Green
            backgroundDark: '#0B3D2E',
            surface: '#0F4D3A',
            glass: 'rgba(255,255,255,0.05)',
            glassBorder: 'rgba(255,255,255,0.1)',
            text: '#FFFFFF',
            textSecondary: '#9CA3AF',
            textOnDark: '#FFFFFF',
            inputBackground: 'rgba(0, 0, 0, 0.3)',
            destructive: '#D64545',
            white: '#FFFFFF',
            accent: '#FCD34D',
            gray500: '#7A8793',
            success: '#10B981',
            // Aliases de compatibilidade
            border: 'rgba(255,255,255,0.1)',
            card: '#0F4D3A',
            error: '#D64545'
        },
        params: {
            radius: 18,
            glass: true,
            inputHeight: 56,
            cardElevation: 2
        }
    }
};

const ThemeContext = createContext({
    theme: 'light_standard',
    colors: THEMES.light_standard.colors,
    themeParams: THEMES.light_standard.params,
    setTheme: () => { },
    isDark: false
});

export const ThemeProvider = ({ children }) => {
    const [themeKey, setThemeKey] = useState('light_standard');
    const [themeConfig, setThemeConfig] = useState(THEMES.light_standard);

    // Load theme on mount
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_KEY);
            if (savedTheme && THEMES[savedTheme]) {
                setThemeKey(savedTheme);
                setThemeConfig(THEMES[savedTheme]);
            }
        } catch (e) {
            console.error('Error loading theme:', e);
        }
    };

    const setTheme = async (newThemeKey) => {
        try {
            if (THEMES[newThemeKey]) {
                setThemeKey(newThemeKey);
                setThemeConfig(THEMES[newThemeKey]);
                await AsyncStorage.setItem(THEME_KEY, newThemeKey);
            }
        } catch (e) {
            console.error('Error saving theme:', e);
        }
    };

    return (
        <ThemeContext.Provider value={{
            theme: themeKey,
            colors: themeConfig.colors,
            themeParams: themeConfig.params,
            setTheme,
            isDark: themeConfig.isDark
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const AVAILABLE_THEMES = THEMES;
