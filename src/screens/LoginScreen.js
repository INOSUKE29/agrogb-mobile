import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Image, KeyboardAvoidingView,
    Platform, Alert, Dimensions, StatusBar, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { login } from '../services/authService';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const { isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Premium Access', 'Por favor, informe suas credenciais.');
        setLoading(true);
        try {
            const res = await login(email, password);
            if (res.success) {
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } else {
                Alert.alert('Acesso Negado', res.message || 'Credenciais inválidas.');
            }
        } catch {
            setLoading(false);
            Alert.alert('Erro', 'Falha ao autenticar.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B'] : ['#10B981', '#059669']}
                style={styles.background}
            >
                <View style={styles.topCircle} />
                <View style={styles.bottomCircle} />

                <View style={styles.inner}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={{ uri: 'https://i.ibb.co/L6HhLp0/logo-agrogb.png' }}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>AGROGB ELITE</Text>
                        <Text style={styles.subtitle}>Gestão Rural de Alta Performance</Text>

                        <GlowInput
                            placeholder="Seu e-mail corporativo"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                        />

                        <GlowInput
                            placeholder="Sua senha segura"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                        />

                        <PrimaryButton
                            title={loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginBtn}
                        />

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={styles.registerLink}
                        >
                            <Text style={styles.registerText}>
                                Não tem conta? <Text style={styles.registerTextBold}>Cadastre sua Fazenda</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1, justifyContent: 'center' },
    topCircle: {
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    bottomCircle: {
        position: 'absolute',
        bottom: -height * 0.15,
        left: -width * 0.1,
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 35,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 120,
        height: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        padding: 25,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    input: {
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#FFF',
    },
    loginBtn: {
        marginTop: 10,
        height: 56,
        borderRadius: 16,
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    registerText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
    registerTextBold: {
        color: '#FFF',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    }
});
