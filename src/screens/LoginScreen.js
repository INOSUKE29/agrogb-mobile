import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, KeyboardAvoidingView,
    Platform, Alert, StatusBar, TouchableOpacity,
    TextInput, ActivityIndicator, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';
import { ErrorService } from '../services/ErrorService';
import * as LocalAuthentication from 'expo-local-authentication';


export default function LoginScreen({ navigation, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

    useEffect(() => {
        // Verifica suporte a biometria no dispositivo (v1.1.2)
        const checkBiometry = async () => {
            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricAvailable(hasHardware && isEnrolled);
            } catch (e) {
                if (__DEV__) console.warn('Erro ao checar biometria:', e);
            }
        };
        checkBiometry();
    }, []);
    const [secureText, setSecureText] = useState(true);

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert('Acesso Restrito', 'Por favor, informe suas credenciais.');
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const isAdmin = email.toLowerCase() === 'admin';

        if (!isEmail && !isAdmin) {
             return Alert.alert('E-mail Inválido', 'Por favor, insira um endereço de e-mail válido ou use o login principal.');
        }

        realLoginFlow(email, password);
    };

    const handleBiometricLogin = async () => {
        setLoading(true);
        try {
            const res = await AuthService.loginWithBiometrics();
            if (res.success) {
                if (__DEV__) console.log('[LoginScreen] Sucesso via Biometria!');
                if (onLoginSuccess) onLoginSuccess(res.user);
            } else {
                Alert.alert('Autenticação Biométrica', res.message || 'Falha ao autenticar.');
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha ao processar biometria.');
        } finally {
            setLoading(false);
        }
    };

    const realLoginFlow = async (email, password) => {
        setLoading(true);
        
        // Monitor de Travamento (Fail-Safe UI) - Aumentado para 60s (v1.1.4)
        const watchdog = setTimeout(() => {
            setLoading(false);
            if (__DEV__) console.warn('[LoginScreen] Monitor de travamento acionado após 60s.');
            Alert.alert(
                'Servidor Lento', 
                'O sistema está demorando mais que o normal para responder. Deseja continuar esperando ou tentar entrar com dados locais?',
                [
                ]
            );
        }, 60000);

        try {
            const res = await AuthService.login(email, password);
            clearTimeout(watchdog);
            
            if (res.success) {
                if (__DEV__) console.log('[LoginScreen] Sucesso! Verificando convite de biometria...');
                
                // Fluxo de Convite Biométrico Aprimorado (v1.1.8)
                const alreadyAsked = await AsyncStorage.getItem('@asked_biometrics');
                const hardware = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();

                if (hardware && !alreadyAsked) {
                    if (enrolled) {
                        Alert.alert(
                            'Acesso Biométrico',
                            'Gostaria de ativar o acesso por digital para entrar mais rápido nas próximas vezes?',
                            [
                                { 
                                    text: 'Agora Não', 
                                    onPress: async () => {
                                        await AsyncStorage.setItem('@asked_biometrics', 'false'); // 'false' mas marcado como perguntado
                                        if (onLoginSuccess) onLoginSuccess(res.user);
                                    }
                                },
                                { 
                                    text: 'Sim, Ativar Agora', 
                                    onPress: async () => {
                                        await AsyncStorage.setItem('@asked_biometrics', 'true');
                                        Alert.alert('Sucesso', 'Login biométrico ativado! Você poderá usar sua digital no próximo acesso.');
                                        if (onLoginSuccess) onLoginSuccess(res.user);
                                    }
                                }
                            ]
                        );
                    } else {
                        // Hardware existe mas usuário não tem biometria no Android/iOS
                        if (__DEV__) console.log('[LoginScreen] Hardware detectado, mas nada cadastrado no OS.');
                        if (onLoginSuccess) onLoginSuccess(res.user);
                    }
                } else {
                    if (onLoginSuccess) onLoginSuccess(res.user);
                }
            } else {
                Alert.alert('Acesso Negado', res.message || 'Credenciais inválidas.');
            }
        } catch (error) {
            clearTimeout(watchdog);
            console.error('[LoginScreen] Ocorreu um erro fatal durante handleLogin:', error);
            ErrorService.logError('LoginScreen', error);
            Alert.alert('Erro no Aplicativo', `Não foi possível completar o login: ${error.message || 'Erro desconhecido'}`);
        } finally {
            clearTimeout(watchdog);
            if (__DEV__) console.log('[LoginScreen] Finalizando estado de loading.');
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient
                colors={['#0B1F35', '#07121E']}
                style={styles.background}
            >
                <View style={styles.topGlow} />
                <View style={styles.bottomGlow} />

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.headerContainer}>
                        <View style={styles.logoShadow}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>AgroGB</Text>
                        <Text style={styles.subtitle}>SISTEMA DE GESTÃO PROFISSIONAL</Text>
                    </View>

                    <View style={styles.formContainer}>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-MAIL OU USUÁRIO</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ex: admin@agrogb.com"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>SENHA DE ACESSO</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={secureText}
                                />
                                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                                    <Ionicons 
                                        name={secureText ? "eye-off" : "eye"} 
                                        size={18} 
                                        color="rgba(255,255,255,0.4)" 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={handleLogin}
                            disabled={loading || !email || !password}
                            style={[
                                styles.loginBtnWrapper,
                                (!email || !password) && { opacity: 0.5, elevation: 0 }
                            ]}
                        >
                            <LinearGradient
                                colors={['#22C55E', '#3B82F6']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.loginBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.loginBtnText}>ENTRAR NO SISTEMA</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {isBiometricAvailable && (
                            <View style={styles.biometricContainer}>
                                <Text style={styles.biometricText}>OU ACESSE COM DIGITAL</Text>
                                <TouchableOpacity 
                                    style={styles.biometricBtn}
                                    onPress={handleBiometricLogin}
                                    disabled={loading}
                                >
                                    <View style={styles.biometricIconWrapper}>
                                        <MaterialCommunityIcons name="fingerprint" size={32} color="#10B981" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.links}>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.linkText}>CRIAR NOVA CONTA</Text>
                            </TouchableOpacity>
                            <View style={styles.dot} />
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.linkText}>RECUPERAR SENHA</Text>
                            </TouchableOpacity>
                        </View>
                        
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>AGROGB ERP • VERSION 1.1 (DIAMOND PRO)</Text>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1 },
    topGlow: {
        position: 'absolute', top: -100, right: -100, width: 300, height: 300,
        borderRadius: 150, backgroundColor: 'rgba(34, 197, 94, 0.08)'
    },
    bottomGlow: {
        position: 'absolute', bottom: -100, left: -100, width: 300, height: 300,
        borderRadius: 150, backgroundColor: 'rgba(59, 130, 246, 0.08)'
    },
    content: { flexGrow: 1, justifyContent: 'center', padding: 30 },
    headerContainer: { alignItems: 'center', marginBottom: 50 },
    logoShadow: {
        shadowColor: '#22C55E', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 20
    },
    logo: { width: 140, height: 140 },
    title: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 2, marginTop: 15 },
    subtitle: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, fontWeight: 'bold', marginTop: 5 },
    formContainer: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginLeft: 5 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, borderHorizontal: 1, borderVertical: 1, borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderStyle: 'solid', borderWidth: 1
    },
    input: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '500' },
    loginBtnWrapper: { marginTop: 20, borderRadius: 18, overflow: 'hidden', elevation: 10, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 15 },
    loginBtn: { paddingVertical: 20, alignItems: 'center' },
    loginBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 20 },
    linkText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
    footer: { marginTop: 60, alignItems: 'center' },
    footerText: { fontSize: 9, fontWeight: 'bold', color: 'rgba(255,255,255,0.2)', letterSpacing: 2 },
    biometricContainer: { alignItems: 'center', marginTop: 30, gap: 10 },
    biometricText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5 },
    biometricBtn: {
        width: 70, height: 70, borderRadius: 35, 
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)',
        shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
    },
    biometricIconWrapper: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center', alignItems: 'center'
    }
});
