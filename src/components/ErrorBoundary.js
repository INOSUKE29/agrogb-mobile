import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Updates from 'expo-updates';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught Error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRestart = async () => {
        try {
            // CRITICAL FIX: Limpar sessão para evitar loop de erro
            await AsyncStorage.multiRemove(['@user_session', '@user_profile', '@menu_config']);
            await Updates.reloadAsync();
        } catch (e) {
            Alert.alert("Erro", "Falha ao reiniciar. Feche o app manualmente.");
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.icon}>🐞</Text>
                        <Text style={styles.title}>Opa! Algo deu errado.</Text>
                        <Text style={styles.subtitle}>
                            O aplicativo encontrou um erro inesperado. Não se preocupe, seus dados estão seguros. Tente reiniciar a tela.
                        </Text>

                        <ScrollView style={styles.errorBox}>
                            <Text style={styles.technicalTitle}>DETALHES TÉCNICOS:</Text>
                            <Text style={styles.errorText}>
                                {this.state.error?.toString()}
                            </Text>
                            <Text style={styles.errorInfoText}>
                                {this.state.errorInfo?.componentStack}
                            </Text>
                        </ScrollView>

                        <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
                            <Text style={styles.buttonText}>TENTAR NOVAMENTE</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FEE2E2', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#FFF', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 10 },
    icon: { fontSize: 50, marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#B91C1C', marginBottom: 10 },
    subtitle: { textAlign: 'center', color: '#4B5563', marginBottom: 20 },
    errorBox: { maxHeight: 200, width: '100%', backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 20 },
    technicalTitle: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', marginBottom: 5 },
    errorText: { fontFamily: 'monospace', fontSize: 11, color: '#B91C1C', fontWeight: 'bold' },
    errorInfoText: { fontFamily: 'monospace', fontSize: 9, color: '#4B5563', marginTop: 10 },
    button: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
    buttonText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 }
});

