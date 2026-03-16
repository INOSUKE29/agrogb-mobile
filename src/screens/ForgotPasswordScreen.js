
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, KeyboardAvoidingView,
    Platform, Alert, TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) return Alert.alert('Ops', 'Informe seu e-mail de cadastro.');
        
        setLoading(true);
        try {
            const res = await AuthService.requestPasswordReset(email);
            if (res.success) {
                Alert.alert('Sucesso', res.message, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Erro', res.message);
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu uma falha inesperada.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#0F3D2E', '#1F7A55']}
                style={styles.background}
            >
                <View style={styles.content}>
                    <TouchableOpacity 
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Ionicons name="key-outline" size={60} color="#FFF" />
                        <Text style={styles.title}>Recuperar Senha</Text>
                        <Text style={styles.subtitle}>Enviaremos um link de redefinição para o seu e-mail.</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Seu e-mail cadastrado"
                                placeholderTextColor="#95A5A6"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.resetBtn}
                            onPress={handleReset}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.resetBtnText}>ENVIAR ATUALIZAÇÃO</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1 },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    backBtn: { position: 'absolute', top: 50, left: 24, zIndex: 10 },
    header: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 16 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, elevation: 8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6F7',
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#2C3E50' },
    resetBtn: {
        backgroundColor: '#27AE60',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center'
    },
    resetBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
