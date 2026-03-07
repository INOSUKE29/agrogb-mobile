import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import InputField from '../ui/InputField';
import { AuthService } from '../services/authService';

export default function ResetPasswordScreen({ route, navigation }) {
    const { tokenId } = route.params;
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        if (password !== confirm) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        setLoading(true);
        const result = await AuthService.resetPassword(tokenId, password);
        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Sucesso',
                'Sua senha foi redefinida com sucesso!',
                [{ text: 'Ir para Login', onPress: () => navigation.popToTop() }]
            );
        } else {
            Alert.alert('Erro', result.message);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFill} />

            <View style={styles.content}>
                <Text style={styles.title}>Nova Senha</Text>
                <Text style={styles.subtitle}>
                    Crie uma nova senha segura para acessar sua conta.
                </Text>

                <View style={styles.card}>
                    <InputField
                        label="Nova Senha"
                        icon="lock-closed-outline"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mínimo 6 caracteres"
                        secureTextEntry
                    />

                    <InputField
                        label="Confirmar Senha"
                        icon="lock-closed-outline"
                        value={confirm}
                        onChangeText={setConfirm}
                        placeholder="Repita a senha"
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#064e3b" />
                        ) : (
                            <Text style={styles.btnText}>REDEFINIR SENHA</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#A7F3D0', textAlign: 'center', marginBottom: 32 },
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
