import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getAppSettings, updateAppSetting } from '../database/database';
import { themeLight } from './themeLight';
import { themeDark } from './themeDark';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeConfig, setThemeConfig] = useState('system'); // system, light, dark
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getAppSettings();
            if (settings && settings.theme_mode) {
                setThemeConfig(settings.theme_mode);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de tema:', error);
        } finally {
            setLoading(false);
        }
    };

    const setTheme = async (mode) => {
        try {
            await updateAppSetting('theme_mode', mode);
            setThemeConfig(mode);
        } catch (error) {
            console.error('Erro ao salvar tema:', error);
        }
    };

    const effectiveMode = themeConfig === 'system' ? (systemColorScheme || 'light') : themeConfig;
    const activeTheme = effectiveMode === 'dark' ? themeDark : themeLight;

    return (
        <ThemeContext.Provider value={{
            theme: themeConfig,
            effectiveTheme: effectiveMode,
            colors: activeTheme.colors,
            setTheme,
            isDark: effectiveMode === 'dark'
        }}>
            {!loading && children}
        </ThemeContext.Provider>
    );
};

export const AVAILABLE_THEMES = [
    { id: 'system', label: 'Sistema', icon: 'settings-outline' },
    { id: 'light', label: 'Claro', icon: 'sunny-outline' },
    { id: 'dark', label: 'Escuro', icon: 'moon-outline' },
];

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback para evitar crash se usado fora do Provider
        return {
            theme: 'light',
            effectiveTheme: 'light',
            colors: themeLight.colors,
            setTheme: () => { },
            isDark: false
        };
    }
    return context;
};
