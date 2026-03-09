import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }) {
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Atenção', 'Preencha todos os campos.');
        try {
            const res = await login(email, password);
            if (res.success) { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }
            else { Alert.alert('Erro', res.message || 'Falha no login.'); }
        } catch { Alert.alert('Erro', 'Ocorreu um erro inesperado.'); }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.inner}>
                <Image source={{ uri: 'https://i.ibb.co/L6HhLp0/logo-agrogb.png' }} style={styles.logo} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>AGROGB</Text>
                <TextInput style={styles.input} placeholder="E-MAIL" value={email} onChangeText={setEmail} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="SENHA" value={password} onChangeText={setPassword} secureTextEntry />
                <TouchableOpacity style={styles.btn} onPress={handleLogin}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ENTRAR</Text></TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    logo: { width: 100, height: 100, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
    input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#EEE', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
    btn: { width: '100%', height: 50, backgroundColor: '#15803D', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});
