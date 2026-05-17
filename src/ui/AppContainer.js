import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * AppContainer - Contêiner de Layout Reativo Padrão 📱🌿
 * Fornece a fundação de SafeAreaView e fundo (background) dinâmico
 * para consistência visual absoluta em todas as telas em ambos os temas.
 */
export default function AppContainer({ children, style, ...props }) {
    const { theme } = useTheme();
    const colors = theme?.colors || {};

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background || '#020617' }]}>
            <View style={[styles.container, { backgroundColor: colors.background || '#020617' }, style]} {...props}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    }
});
