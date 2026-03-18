import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Updates from 'expo-updates';
import { ErrorService } from '../services/ErrorService';
import { Ionicons } from '@expo/vector-icons';

/**
 * ErrorBoundary - AgroGB Resilience UI 🛡️
 * Captura erros de renderização e oferece uma saída amigável ao usuário.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Envia para o serviço de monitoramento
        ErrorService.logError('GlobalErrorBoundary', error, errorInfo.componentStack);
    }

    handleRestart = async () => {
        try {
            await Updates.reloadAsync();
        } catch {
            this.setState({ hasError: false });
        }
    };

    handleReport = () => {
        ErrorService.reportLatestError();
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Ionicons name="alert-circle" size={80} color="#EF4444" />
                        <Text style={styles.title}>Ops! Algo deu errado.</Text>
                        <Text style={styles.subtitle}>
                            Ocorreu um erro inesperado na visualização. 
                            Nossa equipe técnica já foi notificada para correção.
                        </Text>

                        <TouchableOpacity 
                            style={styles.buttonPrimary} 
                            onPress={this.handleRestart}
                        >
                            <Text style={styles.buttonText}>Recarregar Aplicativo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.buttonSecondary} 
                            onPress={this.handleReport}
                        >
                            <Ionicons name="share-social-outline" size={20} color="#6B7280" />
                            <Text style={styles.secondaryText}>Enviar Relatório de Erro</Text>
                        </TouchableOpacity>

                        <Text style={styles.footer}>AgroGB v8.5.0 • Sistema de Monitoramento Ativo</Text>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    card: {
        backgroundColor: '#FFF',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 20,
        marginBottom: 12
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30
    },
    buttonPrimary: {
        backgroundColor: '#15803D',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    },
    buttonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        width: '100%',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16
    },
    secondaryText: {
        marginLeft: 8,
        color: '#4B5563',
        fontWeight: '600'
    },
    footer: {
        marginTop: 30,
        fontSize: 10,
        color: '#9CA3AF'
    }
});

export default ErrorBoundary;
