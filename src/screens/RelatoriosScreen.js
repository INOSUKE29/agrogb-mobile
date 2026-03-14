import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { useTheme } from '../theme/ThemeContext';

export default function RelatoriosScreen({ navigation }) {
    const { colors } = useTheme();

    return (
        <AppContainer>
            <ScreenHeader title="Relatórios" onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <Text style={[styles.text, { color: colors.textPrimary }]}>
                    Acesse a aba 'Gráficos' no menu principal para visualizar o novo painel profissional de Analytics da AgroGB.
                </Text>
            </View>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24
    }
});
