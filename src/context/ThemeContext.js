import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAppSettings, updateAppSetting } from '../database/database';
import { theme as defaultTheme } from '../styles/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [themeState, setThemeState] = useState({
        theme_mode: 'light',
        primary_color: defaultTheme.colors.primary,
        loading: true
    });

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const settings = await getAppSettings();
            const mode = settings?.theme_mode || 'light';
            const primary = settings?.primary_color || defaultTheme.colors.primary;
            setThemeState({
                theme_mode: mode,
                primary_color: primary,
                loading: false
            });
        } catch (error) {
            console.error('Falha ao carregar tema:', error);
            setThemeState(prev => ({ ...prev, loading: false }));
        }
    };

    const saveTheme = async (mode, color) => {
        try {
            // Salvar no Banco
            if (mode) await updateAppSetting('theme_mode', mode);
            if (color) await updateAppSetting('primary_color', color);

            // Atualizar Estado Interno
            setThemeState(prev => ({
                ...prev,
                theme_mode: mode || prev.theme_mode,
                primary_color: color || prev.primary_color,
            }));
        } catch (error) {
            console.error('Falha ao salvar tema:', error);
            throw error;
        }
    };

    // Constrói o tema dinâmico baseado no modo atual e nos tokens de theme.js
    const activeColors = themeState.theme_mode === 'dark' ? defaultTheme.dark : defaultTheme.light;
    const activeTheme = {
        ...defaultTheme,
        theme_mode: themeState.theme_mode,
        primary_color: themeState.primary_color,
        colors: {
            ...defaultTheme.colors,
            ...activeColors,
            primary: themeState.primary_color || activeColors.primary
        }
    };

    return (
        <ThemeContext.Provider value={{ theme: activeTheme, saveTheme, loadTheme }}>
            {!themeState.loading && children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        return { theme: defaultTheme, isDarkMode: false };
    }
    return { 
        ...context, 
        isDarkMode: context.theme.theme_mode === 'dark' 
    };
};

