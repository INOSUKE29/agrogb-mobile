import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../components/InputField';
import { AuthService } from '../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!identifier.trim()) {
            Alert.alert('Atenção', 'Digite seu telefone ou e-mail.');
            return;
        }

        setLoading(true);
        const result = await AuthService.requestPasswordReset(identifier);
        setLoading(false);

        if (result.success) {
            // SIMULATION: Show code in alert for dev purposes
            Alert.alert(
                'Código Enviado',
                `Simulação: Seu código é ${result.devCode}`,
                [
                    { text: 'OK', onPress: () => navigation.navigate('VerifyCode', { identifier }) }
                ]
            );
        } else {
            Alert.alert('Erro', result.message);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFill} />

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-open-outline" size={40} color="#10B981" />
                </View>

                <Text style={styles.title}>Recuperar Senha</Text>
                <Text style={styles.subtitle}>
                    Informe seu telefone ou e-mail cadastrado para receber o código de verificação.
                </Text>

                <View style={styles.card}>
                    <InputField
                        label="Telefone ou E-mail"
                        icon="person-outline"
                        value={identifier}
                        onChangeText={setIdentifier}
                        placeholder="Ex: (99) 99999-9999"
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#064e3b" />
                        ) : (
                            <Text style={styles.btnText}>ENVIAR CÓDIGO</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8 },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center', justifyContent: 'center',
        alignSelf: 'center', marginBottom: 24
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#A7F3D0', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    button: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        elevation: 4
    },
    btnText: { color: '#064e3b', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});
