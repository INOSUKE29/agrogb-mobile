import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAppSettings, updateAppSetting } from '../database/database';
import { theme as defaultTheme } from '../styles/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState({
        ...defaultTheme,
        primary_color: defaultTheme.colors.primary,
        theme_mode: 'light',
        loading: true
    });

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const settings = await getAppSettings();
            if (settings) {
                setTheme(prev => ({
                    ...prev,
                    colors: {
                        ...prev.colors,
                        primary: settings.primary_color || prev.colors.primary,
                    },
                    primary_color: settings.primary_color || prev.colors.primary,
                    theme_mode: settings.theme_mode || 'light',
                    loading: false
                }));
            } else {
                setTheme(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error('Falha ao carregar tema:', error);
            setTheme(prev => ({ ...prev, loading: false }));
        }
    };

    const saveTheme = async (mode, color) => {
        try {
            // Salvar no Banco
            if (mode) await updateAppSetting('theme_mode', mode);
            if (color) await updateAppSetting('primary_color', color);

            // Atualizar Contexto
            setTheme(prev => ({
                ...prev,
                theme_mode: mode || prev.theme_mode,
                primary_color: color || prev.primary_color,
                colors: {
                    ...prev.colors,
                    primary: color || prev.colors.primary
                }
            }));
        } catch (error) {
            console.error('Falha ao salvar tema:', error);
            throw error;
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, saveTheme, loadTheme }}>
            {!theme.loading && children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback para evitar erro bg of undefined se usado fora do provider
        return { theme: defaultTheme };
    }
    return context;
};

