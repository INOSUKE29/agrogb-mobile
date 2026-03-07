import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../ui/InputField';
import { AuthService } from '../services/authService';

export default function VerifyCodeScreen({ route, navigation }) {
    const { identifier } = route.params;
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length < 6) {
            Alert.alert('Erro', 'O código deve ter 6 dígitos.');
            return;
        }

        setLoading(true);
        const result = await AuthService.verifyResetToken(identifier, code);
        setLoading(false);

        if (result.success) {
            navigation.navigate('ResetPassword', { tokenId: result.tokenId });
        } else {
            Alert.alert('Inválido', result.message);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFill} />

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={styles.title}>Verificar Código</Text>
                <Text style={styles.subtitle}>
                    Digite o código de 6 dígitos enviado para{'\n'}
                    <Text style={{ fontWeight: 'bold' }}>{identifier}</Text>
                </Text>

                <View style={styles.card}>
                    <InputField
                        label="Código de Verificação"
                        icon="key-outline"
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        placeholder="000000"
                        maxLength={6}
                        style={{ letterSpacing: 8, fontSize: 24, textAlign: 'center' }}
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#064e3b" />
                        ) : (
                            <Text style={styles.btnText}>CONFIRMAR</Text>
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
