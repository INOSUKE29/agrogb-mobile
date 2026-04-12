/**
 * LoginScreen.js — AgroGB OS
 * Réplica exata da imagem "perfeita" enviada pelo usuário:
 * - Fundo azul marinho escuro sem foto
 * - Inputs flutuantes sem card de fundo
 * - Botão com degradê verde para azul (ENTRAR NO SISTEMA)
 * - Biometria centralizada abaixo do botão
 * - Rodapé "CRIAR NOVA CONTA  •  RECUPERAR SENHA"
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, KeyboardAvoidingView,
    Platform, Alert, StatusBar, TouchableOpacity,
    TextInput, ActivityIndicator, ScrollView,
    Dimensions, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';
import * as LocalAuthentication from 'expo-local-authentication';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [secureText, setSecureText] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        const checkBiometry = async () => {
            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricAvailable(hasHardware && isEnrolled);
            } catch { setIsBiometricAvailable(false); }
        };
        checkBiometry();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Acesso Restrito', 'Preencha todos os campos.');
        realLoginFlow(email, password);
    };

    const handleBiometricLogin = async () => {
        setLoading(true);
        try {
            const res = await AuthService.loginWithBiometrics();
            if (res.success) { if (onLoginSuccess) onLoginSuccess(res.user); }
            else Alert.alert('Biometria', res.message || 'Falha na autenticação.');
        } catch { Alert.alert('Erro', 'Falha ao processar biometria.'); }
        finally { setLoading(false); }
    };

    const realLoginFlow = async (em, pwd) => {
        setLoading(true);
        const watchdog = setTimeout(() => {
            setLoading(false);
            Alert.alert('Servidor Lento', 'O sistema está demorando mais que o normal.');
        }, 60000);
        try {
            const res = await AuthService.login(em, pwd);
            clearTimeout(watchdog);
            if (res.success) {
                const alreadyAsked = await AsyncStorage.getItem('@asked_biometrics');
                const hardware = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                if (hardware && !alreadyAsked && enrolled) {
                    Alert.alert('Acesso Biométrico', 'Ativar acesso por digital?', [
                        { text: 'Agora não', onPress: async () => { await AsyncStorage.setItem('@asked_biometrics', 'false'); if (onLoginSuccess) onLoginSuccess(res.user); } },
                        { text: 'Sim', onPress: async () => { await AsyncStorage.setItem('@asked_biometrics', 'true'); if (onLoginSuccess) onLoginSuccess(res.user); } }
                    ]);
                } else { if (onLoginSuccess) onLoginSuccess(res.user); }
            } else Alert.alert('Acesso Negado', res.message || 'Credenciais inválidas.');
        } catch {
            clearTimeout(watchdog);
            Alert.alert('Erro', 'Não foi possível completar o acesso.');
        } finally {
            clearTimeout(watchdog);
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* ── BACKGROUND ───────────────── */}
            <View style={StyleSheet.absoluteFill}>
                {/* Degradê Azul Escuro (Navy) */}
                <LinearGradient
                    colors={['#05111C', '#0B1626', '#0A1523', '#060D15']}
                    style={StyleSheet.absoluteFill}
                />
                {/* Formas sutis (círculos) no fundo para dar a textura da imagem */}
                <View style={[styles.bgCircle, { top: -100, right: -150, width: 400, height: 400, backgroundColor: 'rgba(16, 50, 70, 0.2)' }]} />
                <View style={[styles.bgCircle, { bottom: -50, left: -100, width: 300, height: 300, backgroundColor: 'rgba(16, 40, 70, 0.3)' }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1, justifyContent: 'space-between' }]}>
                    
                    <View>
                        {/* ── LOGO E TÍTUTLOS ──────────────────────────────── */}
                        <View style={styles.logoBlock}>
                            <Image
                                source={require('../../assets/logo_agrogb_premium.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandTitle}>AgroGB</Text>
                            <Text style={styles.brandSubtitle}>SISTEMA DE GESTÃO PROFISSIONAL</Text>
                        </View>

                        {/* ── INPUTS (sem card, flutuantes) ───────────────── */}
                        <View style={styles.formSection}>
                            
                            {/* E-mail ou Usuário */}
                            <Text style={styles.fieldLabel}>E-MAIL OU USUÁRIO</Text>
                            <View style={styles.inputRow}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ex: admin@agrogb.com"
                                    placeholderTextColor="#4B5563"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Senha */}
                            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>SENHA DE ACESSO</Text>
                            <View style={styles.inputRow}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#4B5563"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={secureText}
                                />
                                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                                    <Ionicons
                                        name={secureText ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Botão ENTRAR (Verde para Azul) */}
                            <TouchableOpacity style={styles.enterBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.87}>
                                <LinearGradient
                                    colors={['#178243', '#25508D']} // Degradê Verde->Azul exato do print
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.enterBtnGradient}
                                >
                                    {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.enterBtnText}>ENTRAR NO SISTEMA</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── BIOMETRIA E RODAPÉ ───────────────────── */}
                    <View style={styles.bottomSection}>
                        <View style={styles.bioContainer}>
                            <Text style={styles.bioTitle}>OU ACESSE COM DIGITAL</Text>
                            <TouchableOpacity onPress={handleBiometricLogin} style={styles.fpButtonContainer} activeOpacity={0.8}>
                                <View style={styles.fpGlow}>
                                    <MaterialCommunityIcons name="fingerprint" size={38} color="#10B981" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Footer Links */}
                        <View style={styles.footerRow}>
                            <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                                <Text style={styles.footerLink}>CRIAR NOVA CONTA</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.footerDot}>•</Text>
                            
                            <TouchableOpacity onPress={() => navigation?.navigate?.('ForgotPassword')}>
                                <Text style={styles.footerLink}>RECUPERAR SENHA</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    bgCircle: { position: 'absolute', borderRadius: 500 }, // Subtle background shapes

    scroll: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: Platform.OS === 'ios' ? 80 : 70,
        paddingBottom: 30,
    },

    /* L O G O */
    logoBlock: { alignItems: 'center', marginBottom: 40 },
    logoImage: { width: 150, height: 150, marginBottom: 20 },
    brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5, marginBottom: 6 },
    brandSubtitle: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },

    /* F O R M */
    formSection: { width: '100%', marginBottom: 30 },
    fieldLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 10,
        marginLeft: 2
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: 14,
        paddingHorizontal: 18,
        height: 60,
        borderWidth: 1.5,
        borderColor: '#1E293B',
        gap: 12,
    },
    input: { flex: 1, color: '#FFF', fontSize: 16 },

    /* B O T T O N */
    enterBtn: {
        marginTop: 35,
        borderRadius: 14,
        overflow: 'hidden',
    },
    enterBtnGradient: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    enterBtnText: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.5,
    },

    /* B I O M E T R I A */
    bottomSection: {
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 10 : 0
    },
    bioContainer: { alignItems: 'center', marginBottom: 40 },
    bioTitle: { color: '#6B7280', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 16 },
    fpButtonContainer: {
        width: 70, height: 70,
        borderRadius: 35,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(5, 40, 45, 0.4)',
        borderWidth: 1, borderColor: '#059669',
        // Optional subtle glow shadow
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 8
    },
    fpGlow: {
        justifyContent: 'center', alignItems: 'center'
    },

    /* F O O T E R */
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
    footerLink: { color: '#9CA3AF', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    footerDot: { color: '#4B5563', fontSize: 12, fontWeight: 'bold' },
});
