import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Só loga no console — sem chamadas externas que podem falhar
        console.error('[ErrorBoundary] CRASH:', error);
        console.error('[ErrorBoundary] Stack:', errorInfo?.componentStack);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            const errorMsg = this.state.error?.toString() || 'Erro desconhecido';
            const stack = this.state.error?.stack || '';
            const compStack = this.state.errorInfo?.componentStack || '';

            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.icon}>🐞</Text>
                        <Text style={styles.title}>Opa! Algo deu errado.</Text>

                        <ScrollView style={styles.errorBox}>
                            <Text style={styles.label}>ERRO:</Text>
                            <Text style={styles.errorText}>{errorMsg}</Text>

                            <Text style={styles.label}>STACK TRACE:</Text>
                            <Text style={styles.errorText}>{stack}</Text>

                            <Text style={styles.label}>COMPONENTE:</Text>
                            <Text style={styles.errorText}>{compStack}</Text>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        >
                            <Text style={styles.buttonText}>TENTAR REINICIAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FEE2E2', justifyContent: 'center', padding: 10 },
    card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, elevation: 10, maxHeight: '95%' },
    icon: { fontSize: 40, textAlign: 'center', marginBottom: 10 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#B91C1C', textAlign: 'center', marginBottom: 10 },
    label: { fontSize: 9, fontWeight: 'bold', color: '#6B7280', marginTop: 8, marginBottom: 2 },
    errorBox: { maxHeight: 400, width: '100%', backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8, marginBottom: 16 },
    errorText: { fontFamily: 'monospace', fontSize: 9, color: '#1F2937' },
    button: { backgroundColor: '#B91C1C', padding: 12, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 }
});
